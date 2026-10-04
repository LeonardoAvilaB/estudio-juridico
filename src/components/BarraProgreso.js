import { View } from 'react-native'
import { crearEstilos, radios } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/** Barra de progreso horizontal. `porcentaje` va de 0 a 100. */
export default function BarraProgreso({
  porcentaje,
  alto = 8,
  color,
  fondo,
  style,
}) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const colorRelleno = color || colors.dorado
  const colorFondo = fondo || colors.borde
  const ancho = Math.max(0, Math.min(porcentaje || 0, 100))

  return (
    <View
      style={[styles.fondo, { height: alto, borderRadius: alto / 2, backgroundColor: colorFondo }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ancho) }}
    >
      <View style={{ height: alto, borderRadius: alto / 2, backgroundColor: colorRelleno, width: `${ancho}%` }} />
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  fondo: { overflow: 'hidden', borderRadius: radios.xs },
}))
