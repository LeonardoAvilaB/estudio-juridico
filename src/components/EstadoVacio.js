import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Boton from './Boton'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Mensaje centrado para listas vacías o búsquedas sin resultados.
 *
 * `accion` ({ label, icono, onPress }) agrega un botón dentro del propio estado
 * vacío: sin eso, quien abre la app por primera vez ve una pantalla vacía y
 * tiene que deducir por su cuenta cuál es el siguiente paso.
 */
export default function EstadoVacio({
  icono = 'file-tray-outline',
  mensaje,
  detalle,
  color,
  colorMensaje,
  accion,
  style,
}) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)

  return (
    <View style={[styles.contenedor, style]}>
      <Ionicons name={icono} size={48} color={color || colors.borde} />
      <Text style={[styles.mensaje, { color: colorMensaje || colors.textoSuave }]}>{mensaje}</Text>
      {detalle ? <Text style={styles.detalle}>{detalle}</Text> : null}
      {accion ? (
        <Boton
          label={accion.label}
          icono={accion.icono}
          variante="secundario"
          onPress={accion.onPress}
          style={styles.boton}
        />
      ) : null}
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia) => ({
  contenedor: { alignItems: 'center', padding: espaciado.xl + 8, gap: espaciado.sm + 4 },
  mensaje: { ...tipografia.cuerpo, textAlign: 'center' },
  detalle: { ...tipografia.secundario, textAlign: 'center' },
  boton: { marginTop: espaciado.sm, alignSelf: 'stretch' },
}))
