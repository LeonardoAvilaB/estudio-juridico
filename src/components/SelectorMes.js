import { useState } from 'react'
import { View } from 'react-native'
import { crearEstilos, radios, espaciado, TOUCH_MIN } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

// Margen a cada lado para que el tirador no se corte en los extremos.
const MARGEN = 14
const TIRADOR = 22

/**
 * Barra deslizante para recorrer los meses del gráfico.
 *
 * El puntero propio de la librería no servía: se posiciona una sola vez al montar
 * (`initialPointerIndex` se aplica en un efecto con dependencias vacías), así que
 * no se puede mover desde afuera. Y arrastrar sobre el gráfico pelea con el scroll
 * vertical de la pantalla.
 *
 * Usa los props de responder directamente en vez de `PanResponder`: son
 * manejadores de evento normales, así que cada uno lee los valores del render
 * vigente y no hace falta guardar nada en refs.
 *
 * Los hijos van con `pointerEvents="none"` a propósito: así `locationX` siempre se
 * mide contra este contenedor y el arrastre no salta al pasar sobre el tirador.
 */
export default function SelectorMes({ etiquetas, indice, onCambiar }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const [ancho, setAncho] = useState(0)

  const total = etiquetas.length
  const util = Math.max(ancho - 2 * MARGEN, 0)
  const paso = total > 1 ? util / (total - 1) : 0
  const x = MARGEN + paso * indice

  function mover(posicion) {
    if (util <= 0 || total < 2) return
    const proporcion = Math.max(0, Math.min((posicion - MARGEN) / util, 1))
    const nuevo = Math.round(proporcion * (total - 1))
    if (nuevo !== indice) onCambiar(nuevo)
  }

  function saltar(delta) {
    const nuevo = Math.max(0, Math.min(indice + delta, total - 1))
    if (nuevo !== indice) onCambiar(nuevo)
  }

  return (
    <View
      style={styles.zona}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      // Impide que el ScrollView de la pantalla se quede con el gesto a mitad
      // del arrastre.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => mover(e.nativeEvent.locationX)}
      onResponderMove={(e) => mover(e.nativeEvent.locationX)}
      accessibilityRole="adjustable"
      accessibilityLabel="Mes del gráfico"
      accessibilityValue={{ min: 0, max: total - 1, now: indice, text: etiquetas[indice] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') saltar(1)
        if (e.nativeEvent.actionName === 'decrement') saltar(-1)
      }}
    >
      <View style={styles.riel} pointerEvents="none" />

      {/* Tramo recorrido, para que se vea de dónde viene el tirador. */}
      <View
        style={[styles.rielActivo, { left: MARGEN, width: paso * indice }]}
        pointerEvents="none"
      />

      {ancho > 0 &&
        etiquetas.map((etiqueta, i) => (
          <View
            key={etiqueta}
            pointerEvents="none"
            style={[
              styles.marca,
              { left: MARGEN + paso * i - 2 },
              i === indice && styles.marcaOculta,
            ]}
          />
        ))}

      {ancho > 0 && (
        <View style={[styles.tirador, { left: x - TIRADOR / 2 }]} pointerEvents="none">
          <View style={styles.tiradorCentro} />
        </View>
      )}
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  zona: {
    height: TOUCH_MIN,
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  riel: {
    position: 'absolute',
    left: MARGEN,
    right: MARGEN,
    height: 4,
    borderRadius: radios.pill,
    backgroundColor: colors.borde,
  },
  rielActivo: {
    position: 'absolute',
    height: 4,
    borderRadius: radios.pill,
    backgroundColor: colors.dorado,
  },
  marca: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: radios.pill,
    backgroundColor: colors.textoSuave,
    opacity: 0.5,
  },
  // Bajo el tirador la marca estorba.
  marcaOculta: { opacity: 0 },
  tirador: {
    position: 'absolute',
    width: TIRADOR,
    height: TIRADOR,
    borderRadius: radios.pill,
    backgroundColor: colors.superficie,
    borderWidth: 2,
    borderColor: colors.dorado,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombras.nivel2,
  },
  tiradorCentro: {
    width: 8,
    height: 8,
    borderRadius: radios.pill,
    backgroundColor: colors.dorado,
  },
}))
