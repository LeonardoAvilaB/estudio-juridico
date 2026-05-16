import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native'
import { supabase } from '../lib/supabase'

const ESTADOS = ['Todos', 'Activo', 'En espera', 'Cerrado']

const colorEstado = {
  'Activo': '#27ae60',
  'En espera': '#f39c12',
  'Cerrado': '#95a5a6',
}

export default function ClientesScreen({ navigation }) {
  const [clientes, setClientes] = useState([])
  const [filtrados, setFiltrados] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientes()
    const unsubscribe = navigation.addListener('focus', fetchClientes)
    return unsubscribe
  }, [navigation])

  useEffect(() => {
    let resultado = clientes
    if (estadoFiltro !== 'Todos') {
      resultado = resultado.filter((c) => c.estado === estadoFiltro)
    }
    if (busqueda.trim() !== '') {
      const texto = busqueda.toLowerCase()
      resultado = resultado.filter(
        (c) =>
          c.nombre.toLowerCase().includes(texto) ||
          (c.descripcion_caso && c.descripcion_caso.toLowerCase().includes(texto)) ||
          (c.telefono && c.telefono.includes(texto))
      )
    }
    setFiltrados(resultado)
  }, [busqueda, clientes, estadoFiltro])

  async function fetchClientes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('fecha_registro', { ascending: false })
    if (error) Alert.alert('Error', error.message)
    else {
      setClientes(data)
      setFiltrados(data)
    }
    setLoading(false)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={cerrarSesion} style={{ marginRight: 16 }}>
          <Text style={{ color: '#e74c3c' }}>Salir</Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const renderCliente = ({ item }) => {
    const pagado = item.total_pagado || 0
    const pendiente = item.monto_total - pagado
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalleCliente', { cliente: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <View style={[styles.estadoBadge, { backgroundColor: colorEstado[item.estado] || '#95a5a6' }]}>
            <Text style={styles.estadoBadgeText}>{item.estado || 'Activo'}</Text>
          </View>
        </View>
        <Text style={styles.caso} numberOfLines={1}>{item.descripcion_caso}</Text>
        <View style={styles.montos}>
          <Text style={styles.total}>Total: Bs. {item.monto_total}</Text>
          <Text style={[styles.pendiente, { color: pendiente > 0 ? '#e74c3c' : '#27ae60' }]}>
            {pendiente > 0 ? `Debe: Bs. ${pendiente}` : '✓ Pagado'}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Buscar por nombre, caso o teléfono..."
          value={busqueda}
          onChangeText={setBusqueda}
          clearButtonMode="while-editing"
        />
        <View style={styles.filtroEstados}>
          {ESTADOS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.filtroBtn, estadoFiltro === e && styles.filtroBtnActivo]}
              onPress={() => setEstadoFiltro(e)}
            >
              <Text style={[styles.filtroText, estadoFiltro === e && styles.filtroTextActivo]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <Text style={styles.loading}>Cargando...</Text>
      ) : filtrados.length === 0 ? (
        <Text style={styles.empty}>
          {busqueda || estadoFiltro !== 'Todos' ? 'No se encontraron resultados' : 'No hay clientes registrados'}
        </Text>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => item.id}
          renderItem={renderCliente}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NuevoCliente')}>
        <Text style={styles.fabText}>+ Nuevo Cliente</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInput: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 10, fontSize: 14, color: '#333', marginBottom: 10 },
  filtroEstados: { flexDirection: 'row', gap: 8 },
  filtroBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filtroBtnActivo: { backgroundColor: '#1a1a2e' },
  filtroText: { fontSize: 12, color: '#555', fontWeight: '600' },
  filtroTextActivo: { color: '#fff' },
  loading: { textAlign: 'center', marginTop: 40, color: '#666' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nombre: { fontSize: 17, fontWeight: 'bold', color: '#1a1a2e', flex: 1 },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  estadoBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  caso: { fontSize: 13, color: '#888', marginBottom: 8 },
  montos: { flexDirection: 'row', justifyContent: 'space-between' },
  total: { fontSize: 14, color: '#555' },
  pendiente: { fontSize: 14, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})