import { Text, TouchableOpacity } from 'react-native'
import { crearEstilos, radios, espaciado, TOUCH_MIN } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Botón chico de acción sobre una card ("Editar", "Eliminar"): borde del color
 * de la acción y fondo teñido del mismo tono.
 */
export default function BotonTag({ label, onPress, color, fondo, style }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const colorAccion = color || colors.error
  const colorFondo = fondo || (colorAccion === colors.info ? colors.infoFondo : colors.errorFondo)

  return (
    <TouchableOpacity
      style={[styles.tag, { borderColor: colorAccion, backgroundColor: colorFondo }, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.texto, { color: colorAccion }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  tag: {
    minHeight: TOUCH_MIN - 12,
    borderWidth: 1,
    paddingHorizontal: espaciado.sm + 4,
    paddingVertical: espaciado.sm - 2,
    borderRadius: radios.sm,
    justifyContent: 'center',
  },
  texto: { fontSize: 12, fontWeight: '600' },
}))
