import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '../lib/supabase'

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null)
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const unsubscribe = navigation.addListener('focus', fetchStats)
    return unsubscribe
  }, [navigation])

  async function fetchStats() {
    setLoading(true)
    try {
      const { data: clientes } = await supabase.from('clientes').select('*')
      const { data: pagos } = await supabase.from('pagos').select('*')

      const hoy = new Date()
      const mesActual = hoy.getMonth()
      const anioActual = hoy.getFullYear()

      const pagosMes = pagos.filter((p) => {
        const fecha = new Date(p.fecha_pago)
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual
      })

      const totalCobrado = clientes.reduce((sum, c) => sum + parseFloat(c.monto_total || 0), 0)
      const totalRecaudado = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
      const recaudadoMes = pagosMes.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
      const casosActivos = clientes.filter((c) => c.estado === 'Activo').length
      const casosCerrados = clientes.filter((c) => c.estado === 'Cerrado').length
      const casosEspera = clientes.filter((c) => c.estado === 'En espera').length

      // Clientes con deuda pendiente
      const clientesConDeuda = clientes.map((c) => {
        const pagosCliente = pagos.filter((p) => p.cliente_id === c.id)
        const totalPagado = pagosCliente.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
        const pendiente = parseFloat(c.monto_total || 0) - totalPagado
        return { ...c, pendiente, totalPagado }
      }).filter((c) => c.pendiente > 0).sort((a, b) => b.pendiente - a.pendiente)

      setStats({ totalCobrado, totalRecaudado, recaudadoMes, casosActivos, casosCerrados, casosEspera, totalClientes: clientes.length })
      setPendientes(clientesConDeuda)
    } catch (e) {
      Alert.alert('Error', e.message)
    }
    setLoading(false)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  if (loading) return <View style={styles.center}><Text>Cargando...</Text></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <Text style={styles.titulo}>📊 Resumen General</Text>
        <TouchableOpacity onPress={cerrarSesion}>
          <Text style={styles.salir}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjetas principales */}
      <View style={styles.fila}>
        <View style={[styles.card, { backgroundColor: '#1a1a2e' }]}>
          <Text style={styles.cardLabel}>Total cobrado</Text>
          <Text style={styles.cardValor}>Bs. {stats.totalCobrado.toFixed(2)}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#27ae60' }]}>
          <Text style={styles.cardLabel}>Total recaudado</Text>
          <Text style={styles.cardValor}>Bs. {stats.totalRecaudado.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.fila}>
        <View style={[styles.card, { backgroundColor: '#2980b9' }]}>
          <Text style={styles.cardLabel}>Recaudado este mes</Text>
          <Text style={styles.cardValor}>Bs. {stats.recaudadoMes.toFixed(2)}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#e74c3c' }]}>
          <Text style={styles.cardLabel}>Por cobrar</Text>
          <Text style={styles.cardValor}>Bs. {(stats.totalCobrado - stats.totalRecaudado).toFixed(2)}</Text>
        </View>
      </View>

      {/* Casos por estado */}
      <Text style={styles.seccionTitulo}>Casos por estado</Text>
      <View style={styles.fila}>
        <View style={styles.estadoCard}>
          <Text style={styles.estadoNumero}>{stats.casosActivos}</Text>
          <Text style={[styles.estadoLabel, { color: '#27ae60' }]}>Activos</Text>
        </View>
        <View style={styles.estadoCard}>
          <Text style={styles.estadoNumero}>{stats.casosEspera}</Text>
          <Text style={[styles.estadoLabel, { color: '#f39c12' }]}>En espera</Text>
        </View>
        <View style={styles.estadoCard}>
          <Text style={styles.estadoNumero}>{stats.casosCerrados}</Text>
          <Text style={[styles.estadoLabel, { color: '#95a5a6' }]}>Cerrados</Text>
        </View>
        <View style={styles.estadoCard}>
          <Text style={styles.estadoNumero}>{stats.totalClientes}</Text>
          <Text style={[styles.estadoLabel, { color: '#1a1a2e' }]}>Total</Text>
        </View>
      </View>

      {/* Clientes con deuda */}
      <Text style={styles.seccionTitulo}>Clientes con saldo pendiente</Text>
      {pendientes.length === 0 ? (
        <Text style={styles.vacio}>✅ Todos los clientes están al día</Text>
      ) : (
        pendientes.map((c) => (
          <View key={c.id} style={styles.deudaCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deudaNombre}>{c.nombre}</Text>
              <Text style={styles.deudaDetalle}>
                Pagado: Bs. {c.totalPagado.toFixed(2)} / Total: Bs. {parseFloat(c.monto_total).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.deudaMonto}>Bs. {c.pendiente.toFixed(2)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  salir: { color: '#e74c3c', fontWeight: '600' },
  fila: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, borderRadius: 12, padding: 16 },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 6 },
  cardValor: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12, marginTop: 8 },
  estadoCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', elevation: 1 },
  estadoNumero: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
  estadoLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  deudaCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  deudaNombre: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e' },
  deudaDetalle: { fontSize: 12, color: '#888', marginTop: 2 },
  deudaMonto: { fontSize: 16, fontWeight: 'bold', color: '#e74c3c' },
  vacio: { textAlign: 'center', color: '#27ae60', fontSize: 15, marginTop: 8 },
})