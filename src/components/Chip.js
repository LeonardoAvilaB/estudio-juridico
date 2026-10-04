import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { crearEstilos, radios, espaciado, TOUCH_MIN } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Píldora de filtro. Reemplaza los pares filtroBtn/periodoBtn que estaban
 * duplicados con el mismo código en ClientesScreen y DashboardScreen.
 *
 * `icono` e `iconoFin` son opcionales y sirven para usarla también como
 * disparador de un menú (con un chevron al final).
 */
export default function Chip({
  label,
  activo,
  onPress,
  fondoInactivo,
  icono,
  iconoFin,
  style,
}) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const colorTexto = activo ? colors.dorado : colors.textoSuave

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: fondoInactivo || colors.superficieAlt },
        activo && styles.chipActivo,
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!activo }}
    >
      <View style={styles.contenido}>
        {icono ? <Ionicons name={icono} size={13} color={colorTexto} /> : null}
        <Text style={[styles.texto, activo && styles.textoActivo]}>{label}</Text>
        {iconoFin ? <Ionicons name={iconoFin} size={13} color={colorTexto} /> : null}
      </View>
    </TouchableOpacity>
  )
}

const usarEstilos = crearEstilos((colors, tipografia) => ({
  chip: {
    minHeight: TOUCH_MIN - 8,
    paddingHorizontal: espaciado.sm + 6,
    paddingVertical: espaciado.sm,
    borderRadius: radios.xl,
    borderWidth: 1,
    borderColor: colors.borde,
    justifyContent: 'center',
  },
  chipActivo: { backgroundColor: colors.oscuro, borderColor: colors.dorado },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espaciado.xs + 1 },
  texto: { ...tipografia.secundario, fontWeight: '600' },
  textoActivo: { color: colors.dorado },
}))
