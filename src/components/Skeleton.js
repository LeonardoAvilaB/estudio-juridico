import { useEffect, useState } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { radios } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Bloque de carga con brillo que recorre de izquierda a derecha.
 *
 * Antes era un pulso de opacidad. El brillo es el lenguaje que la gente ya
 * asocia con "cargando", y además da sensación de dirección en vez de latido.
 * Corre con `useNativeDriver`, así que no cuesta renders.
 */
export default function Skeleton({ ancho = '100%', alto = 12, radio = radios.sm, style }) {
  const { colors } = useTema()
  const [avance] = useState(() => new Animated.Value(0))
  // El ancho llega como porcentaje o como número, así que el brillo se desplaza
  // sobre una medida real tomada al montar.
  const [anchoReal, setAnchoReal] = useState(0)

  useEffect(() => {
    if (!anchoReal) return
    const animacion = Animated.loop(
      Animated.timing(avance, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    )
    animacion.start()
    return () => {
      animacion.stop()
      avance.setValue(0)
    }
  }, [anchoReal])

  const translateX = avance.interpolate({
    inputRange: [0, 1],
    outputRange: [-anchoReal, anchoReal],
  })

  return (
    <View
      onLayout={(e) => setAnchoReal(e.nativeEvent.layout.width)}
      style={[
        { width: ancho, height: alto, borderRadius: radio, backgroundColor: colors.borde },
        styles.base,
        style,
      ]}
    >
      {anchoReal > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', colors.superficie, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[StyleSheet.absoluteFill, styles.brillo]}
          />
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  brillo: { opacity: 0.5 },
})
