import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/** Encabezado de sección, con icono dorado opcional y contador a la derecha. */
export default function SeccionTitulo({ children, icono, contador, style }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <View style={[styles.fila, style]}>
      {icono ? <Ionicons name={icono} size={18} color={colors.doradoTexto} /> : null}
      <Text style={styles.titulo}>{children}</Text>
      {contador !== undefined ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{contador}</Text>
        </View>
      ) : null}
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    marginBottom: espaciado.sm + 4,
  },
  titulo: { ...tipografia.seccion, flex: 1 },
  badge: {
    backgroundColor: colors.dorado,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeTexto: { ...tipografia.secundario, color: colors.sobreDorado, fontWeight: 'bold' },
}))
