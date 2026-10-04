import { useState } from 'react'
import { Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { crearEstilos, radios, TOUCH_MIN } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

// Animar el propio touchable en vez de envolverlo en una View evita romper a los
// llamadores que posicionan el botón de forma absoluta.
const TouchableAnimado = Animated.createAnimatedComponent(TouchableOpacity)

function variantes(colors) {
  return {
  primario: {
    backgroundColor: colors.oscuro,
    borderColor: colors.dorado,
    color: colors.dorado,
  },
  secundario: {
    backgroundColor: colors.dorado,
    borderColor: colors.dorado,
    color: colors.sobreDorado,
  },
  peligro: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    color: colors.sobreOscuro,
  },
    neutro: {
      backgroundColor: colors.superficieAlt,
      borderColor: colors.borde,
      color: colors.textoSuave,
    },
  }
}

export default function Boton({
  label,
  onPress,
  variante = 'primario',
  icono,
  loading = false,
  labelCargando,
  disabled = false,
  colorTexto,
  compacto = false,
  style,
  ...rest
}) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const paleta = variantes(colors)
  const v = paleta[variante] || paleta.primario
  const color = colorTexto || v.color
  const texto = loading && labelCargando ? labelCargando : label
  const [escala] = useState(() => new Animated.Value(1))

  function animarEscala(valor) {
    Animated.spring(escala, { toValue: valor, useNativeDriver: true }).start()
  }

  return (
    <TouchableAnimado
      style={[
        styles.boton,
        compacto && styles.compacto,
        { backgroundColor: v.backgroundColor, borderColor: v.borderColor },
        (disabled || loading) && styles.deshabilitado,
        style,
        { transform: [{ scale: escala }] },
      ]}
      onPress={onPress}
      onPressIn={() => animarEscala(0.96)}
      onPressOut={() => animarEscala(1)}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      {...rest}
    >
      {loading && !labelCargando ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          {icono ? <Ionicons name={icono} size={compacto ? 18 : 20} color={color} /> : null}
          <Text style={[styles.texto, compacto && styles.textoCompacto, { color }]}>{texto}</Text>
        </>
      )}
    </TouchableAnimado>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  boton: {
    minHeight: TOUCH_MIN + 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radios.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compacto: { minHeight: TOUCH_MIN, paddingVertical: 10, gap: 6 },
  deshabilitado: { opacity: 0.6 },
  texto: { fontSize: 16, fontWeight: 'bold' },
  textoCompacto: { fontSize: 14, fontWeight: '600' },
}))
