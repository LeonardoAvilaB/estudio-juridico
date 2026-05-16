import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { supabase } from '../lib/supabase'

export default function NotasClienteScreen({ route, navigation }) {
  const { cliente } = route.params
  const [notas, setNotas] = useState(cliente.notas || '')
  const [loading, setLoading] = useState(false)
  const [guardado, setGuardado] = useState(false)

  async function guardarNotas() {
    setLoading(true)
    const { error } = await supabase
      .from('clientes')
      .update({ notas })
      .eq('id', cliente.id)
    setLoading(false)
    if (error) Alert.alert('Error', error.message)
    else {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.cliente}>{cliente.nombre}</Text>
        <Text style={styles.subtitulo}>Notas internas del caso</Text>
      </View>

      <TextInput
        style={styles.textarea}
        value={notas}
        onChangeText={(text) => { setNotas(text); setGuardado(false) }}
        placeholder="Escribe aquí las notas del caso, fechas importantes, acuerdos, estrategias..."
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.button} onPress={guardarNotas} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : guardado ? '✓ Guardado' : 'Guardar Notas'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { marginBottom: 16 },
  cliente: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  subtitulo: { fontSize: 13, color: '#888', marginTop: 2 },
  textarea: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})