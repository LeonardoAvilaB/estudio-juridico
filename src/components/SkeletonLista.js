import { View } from 'react-native'
import Card from './Card'
import Skeleton from './Skeleton'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Silueta de una lista de cards mientras llegan los datos. Imita el contorno
 * real (título, subtítulo y una fila de cifras) para que al aparecer el
 * contenido no salte el layout.
 */
export default function SkeletonLista({ cantidad = 5, conMontos = true }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <View style={styles.contenedor}>
      {Array.from({ length: cantidad }).map((_, i) => (
        <Card key={i} acento={colors.borde} nivel={1} style={styles.card}>
          <View style={styles.header}>
            <Skeleton ancho="55%" alto={15} />
            <Skeleton ancho={64} alto={18} radio={12} />
          </View>
          <Skeleton ancho="80%" alto={11} style={styles.subtitulo} />
          {conMontos && (
            <View style={styles.montos}>
              <View style={styles.montoItem}>
                <Skeleton ancho={40} alto={9} />
                <Skeleton ancho="70%" alto={13} style={styles.montoValor} />
              </View>
              <View style={styles.montoItem}>
                <Skeleton ancho={56} alto={9} />
                <Skeleton ancho="70%" alto={13} style={styles.montoValor} />
              </View>
            </View>
          )}
        </Card>
      ))}
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  contenedor: { padding: espaciado.md },
  card: { marginBottom: espaciado.sm + 2 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espaciado.sm,
  },
  subtitulo: { marginBottom: espaciado.sm + 4 },
  montos: { flexDirection: 'row', gap: espaciado.lg },
  montoItem: { flex: 1, gap: espaciado.sm - 2 },
  montoValor: { marginTop: 2 },
}))
