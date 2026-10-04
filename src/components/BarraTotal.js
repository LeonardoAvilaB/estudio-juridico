import { View, Text } from 'react-native'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Franja negra de resumen que va arriba de una lista: a la izquierda el conteo,
 * a la derecha el total. La usaban PagosRecientesScreen y
 * ClientesPendientesScreen con el mismo código duplicado.
 */
export default function BarraTotal({ descripcion, etiquetaTotal = 'Total', total, colorTotal }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <View style={styles.contenedor}>
      <Text style={styles.descripcion}>{descripcion}</Text>
      <View style={styles.bloqueTotal}>
        <Text style={styles.etiqueta}>{etiquetaTotal}</Text>
        <Text style={[styles.total, { color: colorTotal || colors.dorado }]}>{total}</Text>
      </View>
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  contenedor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: espaciado.md,
    backgroundColor: colors.oscuro,
  },
  descripcion: { ...tipografia.etiqueta, color: colors.doradoClaro, flex: 1, marginRight: espaciado.sm },
  bloqueTotal: { alignItems: 'flex-end' },
  etiqueta: { ...tipografia.micro, color: colors.doradoClaro },
  total: { ...tipografia.monto, fontSize: 19 },
}))
