import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'

export default function NuevoPagoScreen({ route, navigation }) {
  const { clienteId } = route.params
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  async function guardarPago() {
    if (!monto) {
      Alert.alert('Error', 'El monto es obligatorio')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('pagos').insert({
      cliente_id: clienteId,
      monto: parseFloat(monto),
      fecha_pago: fecha,
      notas,
    })
    setLoading(false)
    if (error) Alert.alert('Error', error.message)
    else {
      Alert.alert('Éxito', 'Pago registrado correctamente')
      navigation.goBack()
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.label}>Monto (Bs.) *</Text>
      <TextInput
        style={styles.input}
        value={monto}
        onChangeText={setMonto}
        placeholder="Ej: 500"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Fecha del pago *</Text>
      <TextInput
        style={styles.input}
        value={fecha}
        onChangeText={setFecha}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        value={notas}
        onChangeText={setNotas}
        placeholder="Ej: Primer pago, transferencia bancaria..."
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={guardarPago} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Guardando...' : 'Registrar Pago'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 15 },
  button: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 32 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})