import { useState } from 'react'
import { View, TouchableOpacity, Animated } from 'react-native'
import { radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

// Mismo recurso que en Boton: se anima el propio touchable para no romper a los
// llamadores que lo posicionan de forma absoluta.
const TouchableAnimado = Animated.createAnimatedComponent(TouchableOpacity)

/**
 * Card con el detalle dorado al costado, el patrón visual base de la app.
 *
 * El acento se dibuja con `borderLeftWidth` y no con una View hija, porque en
 * Android el `overflow: 'hidden'` que hacía falta para recortar esa View también
 * recortaba la sombra y dejaba las cards planas.
 *
 * Al ser pulsable usa el mismo hundido elástico que los botones: antes bajaba la
 * opacidad, así que el mismo gesto tenía dos respuestas distintas según dónde
 * tocaras.
 *
 * A partir del nivel 3 usa `superficieElevada`, porque en tema oscuro una sombra
 * negra sobre negro no se ve y la jerarquía se expresa aclarando la superficie.
 */
export default function Card({
  children,
  acento,
  sinAcento = false,
  nivel = 2,
  radio = radios.md,
  padding = espaciado.md,
  onPress,
  style,
  ...rest
}) {
  const { colors, sombras } = useTema()
  const [escala] = useState(() => new Animated.Value(1))
  const colorAcento = acento || colors.dorado

  const estilo = [
    {
      backgroundColor: nivel >= 3 ? colors.superficieElevada : colors.superficie,
      borderRadius: radio,
      padding,
      ...(sinAcento ? null : { borderLeftWidth: 4, borderLeftColor: colorAcento }),
      ...sombras[`nivel${nivel}`],
    },
    style,
  ]

  if (!onPress) {
    return <View style={estilo} {...rest}>{children}</View>
  }

  function animarEscala(valor) {
    Animated.spring(escala, { toValue: valor, useNativeDriver: true }).start()
  }

  return (
    <TouchableAnimado
      style={[...estilo, { transform: [{ scale: escala }] }]}
      onPress={onPress}
      onPressIn={() => animarEscala(0.98)}
      onPressOut={() => animarEscala(1)}
      activeOpacity={1}
      accessibilityRole="button"
      {...rest}
    >
      {children}
    </TouchableAnimado>
  )
}
