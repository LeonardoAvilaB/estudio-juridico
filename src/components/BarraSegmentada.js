import { View, Text } from 'react-native'
import { crearEstilos, radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Una sola barra dividida en tramos proporcionales, con leyenda opcional debajo.
 *
 * Reemplaza dos patrones del resumen: las cuatro cajas de "casos por estado"
 * (que además repetían el total) y el par de cifras sueltas cobrado / por
 * cobrar, donde la proporción entre ambas era lo que realmente importaba y no
 * se veía.
 *
 * `segmentos`: [{ valor, color, label }]
 */
export default function BarraSegmentada({
  segmentos,
  alto = 10,
  conLeyenda = true,
  conPorcentaje = false,
  style,
}) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const visibles = segmentos.filter((s) => s.valor > 0)
  const total = visibles.reduce((sum, s) => sum + s.valor, 0)

  return (
    <View style={style}>
      <View style={[styles.barra, { height: alto, borderRadius: alto / 2 }]}>
        {total === 0 ? (
          <View style={styles.vacia} />
        ) : (
          visibles.map((s, i) => (
            <View
              key={s.label || i}
              style={{ flex: s.valor, backgroundColor: s.color }}
              accessibilityLabel={`${s.label}: ${s.valor}`}
            />
          ))
        )}
      </View>

      {conLeyenda && (
        <View style={styles.leyenda}>
          {segmentos.map((s) => (
            <View key={s.label} style={styles.item}>
              <View style={[styles.punto, { backgroundColor: s.color }]} />
              <Text style={styles.itemLabel}>{s.label}</Text>
              <Text style={styles.itemValor}>
                {conPorcentaje && total > 0
                  ? `${Math.round((s.valor / total) * 100)}%`
                  : s.valor}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  barra: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: colors.borde,
  },
  vacia: { flex: 1, backgroundColor: colors.borde },
  leyenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: espaciado.sm + 4,
    gap: espaciado.sm + 4,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: espaciado.xs + 2 },
  punto: { width: 8, height: 8, borderRadius: radios.pill },
  itemLabel: tipografia.secundario,
  itemValor: { ...tipografia.secundario, color: colors.texto, fontWeight: 'bold' },
}))
