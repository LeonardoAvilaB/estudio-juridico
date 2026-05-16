import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

export default function DetalleClienteScreen({ route, navigation }) {
  const { cliente } = route.params
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPagos()
    const unsubscribe = navigation.addListener('focus', fetchPagos)
    return unsubscribe
  }, [navigation])

  async function fetchPagos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('fecha_pago', { ascending: false })
    if (error) Alert.alert('Error', error.message)
    else setPagos(data)
    setLoading(false)
  }

  async function eliminarPago(id) {
    Alert.alert('Confirmar', '¿Eliminar este pago?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('pagos').delete().eq('id', id)
          if (error) Alert.alert('Error', error.message)
          else fetchPagos()
        }
      }
    ])
  }

  async function eliminarCliente() {
    Alert.alert('Confirmar', '¿Eliminar este cliente y todos sus pagos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('clientes').delete().eq('id', cliente.id)
          if (error) Alert.alert('Error', error.message)
          else navigation.goBack()
        }
      }
    ])
  }

  async function exportarPDF() {
    const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0)
    const pendiente = parseFloat(cliente.monto_total) - totalPagado

    const filasPagos = pagos.map((p, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
        <td style="padding:10px;border-bottom:1px solid #eee">${p.fecha_pago}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:#27ae60;font-weight:bold">Bs. ${parseFloat(p.monto).toFixed(2)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;color:#888">${p.notas || '-'}</td>
      </tr>
    `).join('')

    const html = `
      <html>
        <body style="font-family:Arial,sans-serif;padding:32px;color:#333">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="color:#1a1a2e;margin:0">⚖️ Avila Gutierrez & Asociados</h1>
            <p style="color:#888;margin:4px 0">Reporte de pagos</p>
          </div>

          <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:24px">
            <h2 style="margin:0 0 8px 0;color:#1a1a2e">${cliente.nombre}</h2>
            ${cliente.telefono ? `<p style="margin:4px 0">📞 ${cliente.telefono}</p>` : ''}
            ${cliente.descripcion_caso ? `<p style="margin:4px 0">📋 ${cliente.descripcion_caso}</p>` : ''}
            <p style="margin:4px 0">Estado: <strong>${cliente.estado || 'Activo'}</strong></p>
          </div>

          <div style="display:flex;gap:16px;margin-bottom:24px">
            <div style="flex:1;background:#1a1a2e;color:#fff;padding:16px;border-radius:8px;text-align:center">
              <div style="font-size:12px;opacity:0.8">Total cobrado</div>
              <div style="font-size:20px;font-weight:bold">Bs. ${parseFloat(cliente.monto_total).toFixed(2)}</div>
            </div>
            <div style="flex:1;background:#27ae60;color:#fff;padding:16px;border-radius:8px;text-align:center">
              <div style="font-size:12px;opacity:0.8">Total pagado</div>
              <div style="font-size:20px;font-weight:bold">Bs. ${totalPagado.toFixed(2)}</div>
            </div>
            <div style="flex:1;background:${pendiente > 0 ? '#e74c3c' : '#27ae60'};color:#fff;padding:16px;border-radius:8px;text-align:center">
              <div style="font-size:12px;opacity:0.8">Pendiente</div>
              <div style="font-size:20px;font-weight:bold">Bs. ${pendiente.toFixed(2)}</div>
            </div>
          </div>

          <h3 style="color:#1a1a2e">Historial de pagos</h3>
          ${pagos.length === 0 ? '<p style="color:#aaa">No hay pagos registrados</p>' : `
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#1a1a2e;color:#fff">
                <th style="padding:10px;text-align:left">Fecha</th>
                <th style="padding:10px;text-align:right">Monto</th>
                <th style="padding:10px;text-align:left">Notas</th>
              </tr>
            </thead>
            <tbody>${filasPagos}</tbody>
          </table>`}

          <p style="color:#aaa;font-size:12px;text-align:center;margin-top:32px">
            Generado el ${new Date().toLocaleDateString('es-BO')}
          </p>
        </body>
      </html>
    `

    try {
      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' })
    } catch (e) {
      Alert.alert('Error', e.message)
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16, marginRight: 16 }}>
          <TouchableOpacity onPress={() => navigation.navigate('EditarCliente', { cliente })}>
            <Text style={{ color: '#1a1a2e', fontWeight: '600' }}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={eliminarCliente}>
            <Text style={{ color: '#e74c3c', fontWeight: '600' }}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ),
    })
  }, [navigation, cliente])

  const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0)
  const pendiente = parseFloat(cliente.monto_total) - totalPagado

  return (
    <ScrollView style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.nombre}>{cliente.nombre}</Text>
        {cliente.telefono ? <Text style={styles.detalle}>📞 {cliente.telefono}</Text> : null}
        {cliente.descripcion_caso ? <Text style={styles.detalle}>{cliente.descripcion_caso}</Text> : null}
        <View style={styles.separador} />
        <View style={styles.filaMontos}>
          <View style={styles.montoBox}>
            <Text style={styles.montoLabel}>Total cobrado</Text>
            <Text style={styles.montoValor}>Bs. {parseFloat(cliente.monto_total).toFixed(2)}</Text>
          </View>
          <View style={styles.montoBox}>
            <Text style={styles.montoLabel}>Total pagado</Text>
            <Text style={[styles.montoValor, { color: '#27ae60' }]}>Bs. {totalPagado.toFixed(2)}</Text>
          </View>
          <View style={styles.montoBox}>
            <Text style={styles.montoLabel}>Pendiente</Text>
            <Text style={[styles.montoValor, { color: pendiente > 0 ? '#e74c3c' : '#27ae60' }]}>
              {pendiente > 0 ? `Bs. ${pendiente.toFixed(2)}` : '✓ Pagado'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Historial de pagos</Text>
        {loading ? (
          <Text style={styles.vacio}>Cargando...</Text>
        ) : pagos.length === 0 ? (
          <Text style={styles.vacio}>No hay pagos registrados</Text>
        ) : (
          pagos.map((pago) => (
            <View key={pago.id} style={styles.pagoCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pagoMonto}>Bs. {parseFloat(pago.monto).toFixed(2)}</Text>
                <Text style={styles.pagoFecha}>{pago.fecha_pago}</Text>
                {pago.notas ? <Text style={styles.pagoNota}>{pago.notas}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => eliminarPago(pago.id)}>
                <Text style={styles.eliminar}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('NuevoPago', { clienteId: cliente.id })}
      >
        <Text style={styles.buttonText}>+ Registrar Pago</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonNotas}
        onPress={() => navigation.navigate('NotasCliente', { cliente })}
      >
        <Text style={styles.buttonText}>📝 Notas del Caso</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonPDF} onPress={exportarPDF}>
        <Text style={styles.buttonText}>📄 Exportar PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  infoCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, elevation: 2 },
  nombre: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  detalle: { fontSize: 14, color: '#666', marginBottom: 4 },
  separador: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  filaMontos: { flexDirection: 'row', justifyContent: 'space-between' },
  montoBox: { alignItems: 'center', flex: 1 },
  montoLabel: { fontSize: 11, color: '#888', marginBottom: 4, textAlign: 'center' },
  montoValor: { fontSize: 14, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center' },
  seccion: { marginHorizontal: 16, marginBottom: 16 },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  vacio: { color: '#aaa', textAlign: 'center', marginTop: 8 },
  pagoCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1
  },
  pagoMonto: { fontSize: 16, fontWeight: 'bold', color: '#27ae60' },
  pagoFecha: { fontSize: 12, color: '#888', marginTop: 2 },
  pagoNota: { fontSize: 12, color: '#aaa', marginTop: 2 },
  eliminar: { fontSize: 20, paddingLeft: 8 },
  button: {
    backgroundColor: '#1a1a2e', margin: 16, marginBottom: 8, padding: 16,
    borderRadius: 12, alignItems: 'center'
  },
  buttonPDF: {
    backgroundColor: '#2980b9', marginHorizontal: 16, marginBottom: 40, padding: 16,
    borderRadius: 12, alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonNotas: {
    backgroundColor: '#8e44ad', marginHorizontal: 16, marginBottom: 8, padding: 16,
    borderRadius: 12, alignItems: 'center'
  },
})