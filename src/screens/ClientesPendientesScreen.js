import { useState, useEffect } from 'react'
import { View, Text, FlatList, Animated, RefreshControl } from 'react-native'
import { supabase } from '../lib/supabase'
import { formatMonto } from '../lib/utils'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import { useToast } from '../components/ToastProvider'
import {
  BarraProgreso, BarraTotal, Card, EstadoError, EstadoVacio, SkeletonLista,
} from '../components'

const MAX_ESCALONADO = 6

function ClientePendienteItem({ item, index }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const [entrada] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 400,
      delay: Math.min(index, MAX_ESCALONADO) * 60,
      useNativeDriver: true,
    }).start()
  }, [])

  const translateY = entrada.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })
  const porcentaje = (item.totalPagado / parseFloat(item.monto_total)) * 100

  return (
    <Animated.View style={{ opacity: entrada, transform: [{ translateY }] }}>
      <Card acento={colors.error} style={styles.card} padding={espaciado.sm + 6}>
        <View style={styles.cardHeader}>
          <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.deudaMonto}>Bs. {formatMonto(item.pendiente)}</Text>
        </View>
        {item.descripcion_caso ? (
          <Text style={styles.caso} numberOfLines={1}>{item.descripcion_caso}</Text>
        ) : null}
        <BarraProgreso porcentaje={porcentaje} alto={6} style={styles.barra} />
        <View style={styles.montosFila}>
          <Text style={styles.pagado}>Pagado: Bs. {formatMonto(item.totalPagado)}</Text>
          <Text style={styles.total}>Total: Bs. {formatMonto(item.monto_total)}</Text>
        </View>
      </Card>
    </Animated.View>
  )
}

export default function ClientesPendientesScreen() {
  const { colors, tipografia, sombras } = useTema()
  const mostrarToast = useToast()
  const styles = usarEstilos(colors, tipografia, sombras)
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [falloCarga, setFalloCarga] = useState(false)
  const [totalPendiente, setTotalPendiente] = useState(0)

  useEffect(() => {
    fetchPendientes()
  }, [])

  async function fetchPendientes({ esRefresco = false } = {}) {
    if (esRefresco) setRefrescando(true)
    else setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*, pagos(monto)')
      .eq('abogado_id', user.id)

    if (error || !clientes) {
      mostrarToast('No se pudieron cargar los clientes pendientes')
      setFalloCarga(true)
      setLoading(false)
      setRefrescando(false)
      return
    }

    const clientesConDeuda = clientes.map((c) => {
      const totalPagado = (c.pagos || []).reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
      const pendiente = parseFloat(c.monto_total || 0) - totalPagado
      return { ...c, pendiente, totalPagado }
    }).filter((c) => c.pendiente > 0).sort((a, b) => b.pendiente - a.pendiente)

    const total = clientesConDeuda.reduce((sum, c) => sum + c.pendiente, 0)
    setTotalPendiente(total)
    setPendientes(clientesConDeuda)
    setFalloCarga(false)
    setLoading(false)
    setRefrescando(false)
  }

  if (falloCarga && pendientes.length === 0) {
    return (
      <EstadoError
        mensaje="No se pudieron cargar los clientes pendientes"
        onReintentar={() => fetchPendientes()}
      />
    )
  }

  return (
    <View style={styles.container}>
      <BarraTotal
        descripcion={`${pendientes.length} cliente${pendientes.length !== 1 ? 's' : ''} con saldo pendiente`}
        etiquetaTotal="Total pendiente"
        total={`Bs. ${formatMonto(totalPendiente)}`}
        colorTotal={colors.error}
      />

      <FlatList
        data={pendientes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: espaciado.md, paddingBottom: espaciado.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => fetchPendientes({ esRefresco: true })}
            colors={[colors.doradoTexto]}
            tintColor={colors.doradoTexto}
          />
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonLista cantidad={4} />
          ) : (
            <EstadoVacio
              icono="checkmark-circle-outline"
              color={colors.exito}
              colorMensaje={colors.exito}
              mensaje="Todos los clientes están al día"
            />
          )
        }
        renderItem={({ item, index }) => <ClientePendienteItem item={item} index={index} />}
      />
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  container: { flex: 1, backgroundColor: colors.fondo },
  card: { marginBottom: espaciado.sm + 2 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espaciado.xs,
  },
  nombre: { ...tipografia.nombreCard, flex: 1, marginRight: espaciado.sm },
  deudaMonto: { ...tipografia.monto, color: colors.error },
  caso: { ...tipografia.secundario, marginBottom: espaciado.sm + 2 },
  barra: { marginBottom: espaciado.sm },
  montosFila: { flexDirection: 'row', justifyContent: 'space-between' },
  pagado: { ...tipografia.secundario, color: colors.exito },
  total: tipografia.secundario,
}))
