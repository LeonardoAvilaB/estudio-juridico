import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { crearEstilos, radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Card oscura destacada del resumen: una sola cifra protagonista sobre el negro
 * de la marca, y hasta dos cifras de apoyo debajo de un separador.
 *
 * Antes las cuatro métricas competían entre sí en tarjetas idénticas, y no se
 * notaba que solo una de ellas responde al filtro de período.
 */
export default function HeroCard({ etiqueta, icono, children, subtitulo, secundarias = [], style }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <LinearGradient
      colors={[colors.oscuro, colors.oscuroSuave]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      <View style={styles.encabezado}>
        <Text style={styles.etiqueta}>{etiqueta.toUpperCase()}</Text>
        {icono ? <Ionicons name={icono} size={20} color={colors.dorado} /> : null}
      </View>

      {children}

      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}

      {secundarias.length > 0 && (
        <>
          <View style={styles.separador} />
          <View style={styles.fila}>
            {secundarias.map((s, i) => (
              <View key={s.label} style={[styles.secundaria, i > 0 && styles.secundariaBorde]}>
                <Text style={styles.secundariaLabel}>{s.label}</Text>
                <Text style={[styles.secundariaValor, s.color && { color: s.color }]}>
                  {s.valor}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </LinearGradient>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  card: {
    borderRadius: radios.lg,
    padding: espaciado.lg - 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.dorado,
    ...sombras.nivel3,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espaciado.sm,
  },
  etiqueta: tipografia.heroEtiqueta,
  subtitulo: { ...tipografia.secundario, color: colors.borde, marginTop: espaciado.xs },
  separador: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: espaciado.md,
  },
  fila: { flexDirection: 'row' },
  secundaria: { flex: 1 },
  secundariaBorde: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.12)',
    paddingLeft: espaciado.md,
    marginLeft: espaciado.md,
  },
  secundariaLabel: { ...tipografia.micro, color: colors.textoSuave, marginBottom: espaciado.xs },
  secundariaValor: { ...tipografia.montoPequeno, color: colors.sobreOscuro },
}))
