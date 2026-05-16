import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'

const ESTADOS = ['Activo', 'En espera', 'Cerrado']

export default function EditarClienteScreen({ route, navigation }) {
  const { cliente } = route.params
  const [nombre, setNombre] = useState(cliente.nombre)
  const [telefono, setTelefono] = useState(cliente.telefono || '')
  const [caso, setCaso] = useState(cliente.descripcion_caso || '')
  const [monto, setMonto] = useState(String(cliente.monto_total))
  const [estado, setEstado] = useState(cliente.estado || 'Activo')
  const [loading, setLoading] = useState(false)

  async function guardarCambios() {
    if (!nombre || !monto) {
      Alert.alert('Error', 'El nombre y el monto son obligatorios')
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('clientes')
      .update({ nombre, telefono, descripcion_caso: caso, monto_total: parseFloat(monto), estado })
      .eq('id', cliente.id)
    setLoading(false)
    if (error) Alert.alert('Error', error.message)
    else {
      Alert.alert('Éxito', 'Cliente actualizado correctamente')
      navigation.goBack()
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.label}>Nombre completo *</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

      <Text style={styles.label}>Descripción del caso</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        value={caso}
        onChangeText={setCaso}
        multiline
      />

      <Text style={styles.label}>Monto del servicio (Bs.) *</Text>
      <TextInput style={styles.input} value={monto} onChangeText={setMonto} keyboardType="numeric" />

      <Text style={styles.label}>Estado del caso</Text>
      <View style={styles.estadoContainer}>
        {ESTADOS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.estadoBtn, estado === e && styles.estadoBtnActivo]}
            onPress={() => setEstado(e)}
          >
            <Text style={[styles.estadoText, estado === e && styles.estadoTextActivo]}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={guardarCambios} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 15 },
  estadoContainer: { flexDirection: 'row', gap: 10, marginTop: 4 },
  estadoBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff' },
  estadoBtnActivo: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  estadoText: { fontSize: 13, color: '#555', fontWeight: '600' },
  estadoTextActivo: { color: '#fff' },
  button: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 32 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})