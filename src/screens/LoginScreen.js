import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [nombre, setNombre] = useState('')

  async function handleAuth() {
    setLoading(true)
    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } }
      })
      if (error) Alert.alert('Error', error.message)
      else Alert.alert('Éxito', 'Revisa tu correo para confirmar tu cuenta')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) Alert.alert('Error', error.message)
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.firma}>AVILA GUTIERREZ</Text>
          <Text style={styles.asociados}>& ASOCIADOS</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.subtitle}>
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </Text>

          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#999"
              value={nombre}
              onChangeText={setNombre}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Ingresar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.link}>
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 140, height: 140, marginBottom: 16 },
  firma: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  asociados: { color: '#a8b2c1', fontSize: 12, letterSpacing: 3, marginTop: 4 },
  form: { flex: 1, padding: 24, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginBottom: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 15,
    color: '#333',
  },
  button: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 16, color: '#1a1a2e', textDecorationLine: 'underline' },
})