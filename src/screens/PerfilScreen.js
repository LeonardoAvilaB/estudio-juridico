import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'

export default function PerfilScreen() {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNuevo, setPasswordNuevo] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loadingPerfil, setLoadingPerfil] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)

  useEffect(() => {
    fetchPerfil()
  }, [])

  async function fetchPerfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setEmail(user.email)
      const { data } = await supabase
        .from('profiles')
        .select('nombre')
        .eq('id', user.id)
        .single()
      if (data) setNombre(data.nombre)
    }
  }

  async function actualizarNombre() {
    if (!nombre) {
      Alert.alert('Error', 'El nombre no puede estar vacío')
      return
    }
    setLoadingPerfil(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ nombre })
      .eq('id', user.id)
    setLoadingPerfil(false)
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Éxito', 'Nombre actualizado correctamente')
  }

  async function cambiarPassword() {
    if (!passwordNuevo || !passwordConfirm) {
      Alert.alert('Error', 'Completa todos los campos')
      return
    }
    if (passwordNuevo !== passwordConfirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden')
      return
    }
    if (passwordNuevo.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoadingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passwordNuevo })
    setLoadingPass(false)
    if (error) Alert.alert('Error', error.message)
    else {
      Alert.alert('Éxito', 'Contraseña actualizada correctamente')
      setPasswordNuevo('')
      setPasswordConfirm('')
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.titulo}>👤 Mi Perfil</Text>

      {/* Info de cuenta */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Información de cuenta</Text>
        <Text style={styles.label}>Correo electrónico</Text>
        <View style={styles.inputDeshabilitado}>
          <Text style={styles.inputDeshabilitadoText}>{email}</Text>
        </View>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre completo"
        />
        <TouchableOpacity style={styles.button} onPress={actualizarNombre} disabled={loadingPerfil}>
          <Text style={styles.buttonText}>{loadingPerfil ? 'Guardando...' : 'Actualizar nombre'}</Text>
        </TouchableOpacity>
      </View>

      {/* Cambiar contraseña */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Cambiar contraseña</Text>

        <Text style={styles.label}>Nueva contraseña</Text>
        <TextInput
          style={styles.input}
          value={passwordNuevo}
          onChangeText={setPasswordNuevo}
          secureTextEntry
          placeholder="Mínimo 6 caracteres"
        />

        <Text style={styles.label}>Confirmar nueva contraseña</Text>
        <TextInput
          style={styles.input}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
          placeholder="Repite la nueva contraseña"
        />

        <TouchableOpacity style={styles.button} onPress={cambiarPassword} disabled={loadingPass}>
          <Text style={styles.buttonText}>{loadingPass ? 'Actualizando...' : 'Cambiar contraseña'}</Text>
        </TouchableOpacity>
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.buttonSalir} onPress={cerrarSesion}>
        <Text style={styles.buttonSalirText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 24 },
  seccion: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  seccionTitulo: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#f5f5f5', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 15 },
  inputDeshabilitado: { backgroundColor: '#eee', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  inputDeshabilitadoText: { color: '#888', fontSize: 15 },
  button: { backgroundColor: '#1a1a2e', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  buttonSalir: { backgroundColor: '#e74c3c', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  buttonSalirText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})