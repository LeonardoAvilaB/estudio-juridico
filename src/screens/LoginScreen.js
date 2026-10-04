import { useState, useEffect } from 'react'
import {
  View, Text, Image, KeyboardAvoidingView, ScrollView, Platform, Animated,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Boton, CampoTexto } from '../components'
import { useToast } from '../components/ToastProvider'
import { crearEstilos, radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

export default function LoginScreen() {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const mostrarToast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verPassword, setVerPassword] = useState(false)
  const [errores, setErrores] = useState({})

  const [logoOpacity] = useState(() => new Animated.Value(0))
  const [logoY] = useState(() => new Animated.Value(-30))
  const [formOpacity] = useState(() => new Animated.Value(0))
  const [formY] = useState(() => new Animated.Value(30))

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(logoY, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(formY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  function traducirError(mensaje) {
    if (mensaje.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
    if (mensaje.includes('Email not confirmed')) return 'Debes confirmar tu correo antes de ingresar.'
    if (mensaje.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
    if (mensaje.includes('Unable to validate email')) return 'El formato del correo no es válido.'
    return 'Ocurrió un error. Intenta de nuevo.'
  }

  async function handleLogin() {
    // Los campos faltantes se marcan sobre el propio input; el error que
    // devuelve Supabase va al toast, porque no corresponde a un campo puntual.
    const faltantes = {}
    if (!email) faltantes.email = 'Ingresa tu correo'
    if (!password) faltantes.password = 'Ingresa tu contraseña'
    setErrores(faltantes)
    if (Object.keys(faltantes).length > 0) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) mostrarToast(traducirError(error.message))
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header con logo */}
        <Animated.View style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ translateY: logoY }] }
        ]}>
          {/* El marco recorta las esquinas del PNG, que es un cuadrado opaco. */}
          <View style={styles.escudo}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo de Avila Gutierrez & Asociados"
            />
          </View>
          <Text style={styles.firma}>AVILA GUTIERREZ</Text>
          <Text style={styles.asociados}>& ASOCIADOS</Text>
        </Animated.View>

        {/* Formulario */}
        <Animated.View style={[
          styles.form,
          { opacity: formOpacity, transform: [{ translateY: formY }] }
        ]}>
          <Text style={styles.subtitle}>Iniciar sesión</Text>

          <CampoTexto
            label="Correo electrónico"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrores((e) => ({ ...e, email: undefined })) }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textoError={errores.email}
          />

          <CampoTexto
            label="Contraseña"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrores((e) => ({ ...e, password: undefined })) }}
            secureTextEntry={!verPassword}
            autoComplete="current-password"
            iconoDerecha={verPassword ? 'eye-off' : 'eye'}
            onPressIconoDerecha={() => setVerPassword(!verPassword)}
            textoError={errores.password}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <Boton
            label="Ingresar"
            loading={loading}
            onPress={handleLogin}
            style={styles.button}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const usarEstilos = crearEstilos((colors, tipografia) => ({
  logoContainer: {
    backgroundColor: colors.oscuro,
    paddingVertical: espaciado.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escudo: {
    borderRadius: radios.lg,
    borderWidth: 2,
    borderColor: colors.dorado,
    overflow: 'hidden',
    marginBottom: espaciado.md,
  },
  logo: { width: 140, height: 140 },
  firma: tipografia.marca,
  asociados: {
    ...tipografia.etiqueta,
    color: colors.doradoClaro,
    letterSpacing: 3,
    marginTop: espaciado.xs,
  },
  form: {
    flex: 1,
    padding: espaciado.lg,
    backgroundColor: colors.fondo,
    justifyContent: 'center',
  },
  subtitle: {
    ...tipografia.subtitulo,
    marginBottom: espaciado.lg - 4,
    textAlign: 'center',
  },
  button: { marginTop: espaciado.sm },
}))
