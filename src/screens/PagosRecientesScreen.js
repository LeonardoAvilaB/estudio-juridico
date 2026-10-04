import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Platform, Animated, RefreshControl,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { formatMonto } from '../lib/utils'
import { crearEstilos, radios, espaciado, TOUCH_MIN } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import { useToast } from '../components/ToastProvider'
import { aFechaDB, formatearFechaCorta, formatearFechaLarga } from '../lib/fechas'
import {
  BarraTotal, Boton, Card, EstadoError, EstadoVacio, SeccionTitulo, SkeletonLista,
} from '../components'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'

const MAX_ESCALONADO = 6

function PagoItem({ item, index }) {
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

  return (
    <Animated.View style={{ opacity: entrada, transform: [{ translateY }] }}>
      <Card nivel={1} style={styles.pagoCard} padding={espaciado.sm + 6}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pagoCliente} numberOfLines={1}>
            {item.clientes?.nombre || 'Cliente'}
          </Text>
          <View style={styles.pagoMeta}>
            <Ionicons
              name={item.tipo_pago === 'QR' ? 'qr-code-outline' : 'cash-outline'}
              size={11}
              color={colors.textoSuave}
            />
            <Text style={styles.pagoMetaTexto} numberOfLines={1}>
              {formatearFechaCorta(item.fecha_pago)}
              {item.tipo_pago ? ` · ${item.tipo_pago}` : ''}
              {item.notas ? ` · ${item.notas}` : ''}
            </Text>
          </View>
        </View>
        <Text style={styles.pagoMonto}>Bs. {formatMonto(item.monto)}</Text>
      </Card>
    </Animated.View>
  )
}

export default function PagosRecientesScreen() {
  const { colors, tipografia, sombras } = useTema()
  const mostrarToast = useToast()
  const styles = usarEstilos(colors, tipografia, sombras)
  const [pagos, setPagos] = useState([])
  const [filtrados, setFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [falloCarga, setFalloCarga] = useState(false)
  const [fechaDesde, setFechaDesde] = useState(null)
  const [fechaHasta, setFechaHasta] = useState(null)
  const [mostrarDesde, setMostrarDesde] = useState(false)
  const [mostrarHasta, setMostrarHasta] = useState(false)
  const [filtroActivo, setFiltroActivo] = useState(false)

  useEffect(() => {
    fetchPagos()
  }, [])

  async function fetchPagos({ esRefresco = false } = {}) {
    if (esRefresco) setRefrescando(true)
    else setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('pagos')
      .select('*, clientes!inner(nombre, abogado_id)')
      .eq('clientes.abogado_id', user.id)
      .order('fecha_pago', { ascending: false })
      .limit(100)

    if (error || !data) {
      mostrarToast('No se pudieron cargar los pagos')
      setFalloCarga(true)
    } else {
      setPagos(data)
      setFiltrados(data)
      setFalloCarga(false)
    }
    setLoading(false)
    setRefrescando(false)
  }

  function formatearFechaDisplay(fecha) {
    if (!fecha) return 'Seleccionar fecha'
    return formatearFechaLarga(fecha)
  }

  function aplicarFiltro() {
    let resultado = pagos
    // fecha_pago es 'YYYY-MM-DD', así que comparar como texto ordena bien.
    if (fechaDesde) resultado = resultado.filter(p => p.fecha_pago >= aFechaDB(fechaDesde))
    if (fechaHasta) resultado = resultado.filter(p => p.fecha_pago <= aFechaDB(fechaHasta))
    setFiltrados(resultado)
    setFiltroActivo(true)
  }

  function limpiarFiltro() {
    setFechaDesde(null)
    setFechaHasta(null)
    setFiltrados(pagos)
    setFiltroActivo(false)
  }

  const totalFiltrado = filtrados.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)

  if (falloCarga && pagos.length === 0) {
    return (
      <EstadoError
        mensaje="No se pudieron cargar los pagos"
        onReintentar={() => fetchPagos()}
      />
    )
  }

  return (
    <View style={styles.container}>
      {mostrarDesde && (
        <DateTimePicker
          value={fechaDesde || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={(_evento, fechaElegida) => {
            setMostrarDesde(false)
            setFechaDesde(fechaElegida)
          }}
          onDismiss={() => setMostrarDesde(false)}
        />
      )}
      {mostrarHasta && (
        <DateTimePicker
          value={fechaHasta || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={(_evento, fechaElegida) => {
            setMostrarHasta(false)
            setFechaHasta(fechaElegida)
          }}
          onDismiss={() => setMostrarHasta(false)}
        />
      )}

      {/* Filtro */}
      <View style={styles.filtroContainer}>
        <SeccionTitulo icono="calendar-outline">Filtrar por fecha</SeccionTitulo>
        <View style={styles.filtroFila}>
          <View style={{ flex: 1 }}>
            <Text style={styles.filtroLabel}>Desde</Text>
            <TouchableOpacity
              style={styles.fechaBtn}
              onPress={() => setMostrarDesde(true)}
              accessibilityRole="button"
              accessibilityLabel={`Desde: ${formatearFechaDisplay(fechaDesde)}`}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.doradoTexto} />
              <Text style={[styles.fechaBtnText, !fechaDesde && { color: colors.textoSuave }]}>
                {formatearFechaDisplay(fechaDesde)}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.filtroLabel}>Hasta</Text>
            <TouchableOpacity
              style={styles.fechaBtn}
              onPress={() => setMostrarHasta(true)}
              accessibilityRole="button"
              accessibilityLabel={`Hasta: ${formatearFechaDisplay(fechaHasta)}`}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.doradoTexto} />
              <Text style={[styles.fechaBtnText, !fechaHasta && { color: colors.textoSuave }]}>
                {formatearFechaDisplay(fechaHasta)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.filtroFila}>
          <Boton
            label="Aplicar filtro"
            icono="search-outline"
            variante="secundario"
            onPress={aplicarFiltro}
            compacto
            style={{ flex: 1 }}
          />
          {filtroActivo && (
            <Boton
              label="Limpiar"
              icono="close-outline"
              variante="neutro"
              onPress={limpiarFiltro}
              compacto
              style={styles.limpiarBtn}
            />
          )}
        </View>
      </View>

      <BarraTotal
        descripcion={`${filtrados.length} pago${filtrados.length !== 1 ? 's' : ''}${filtroActivo ? ' en el período' : ' registrados'}`}
        total={`Bs. ${formatMonto(totalFiltrado)}`}
      />

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: espaciado.md, paddingBottom: espaciado.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => fetchPagos({ esRefresco: true })}
            colors={[colors.doradoTexto]}
            tintColor={colors.doradoTexto}
          />
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonLista cantidad={4} conMontos={false} />
          ) : (
            <EstadoVacio icono="receipt-outline" mensaje="No hay pagos registrados" />
          )
        }
        renderItem={({ item, index }) => <PagoItem item={item} index={index} />}
      />
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  container: { flex: 1, backgroundColor: colors.fondo },
  filtroContainer: {
    backgroundColor: colors.superficie,
    padding: espaciado.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  filtroFila: { flexDirection: 'row', marginBottom: espaciado.sm + 2, gap: espaciado.sm + 4 },
  filtroLabel: { ...tipografia.secundario, marginBottom: espaciado.xs },
  fechaBtn: {
    minHeight: TOUCH_MIN - 4,
    backgroundColor: colors.superficieAlt,
    padding: espaciado.sm + 2,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colors.borde,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm - 2,
  },
  fechaBtnText: { ...tipografia.secundario, color: colors.texto, flex: 1 },
  limpiarBtn: { paddingHorizontal: espaciado.md },
  pagoCard: {
    marginBottom: espaciado.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagoCliente: { ...tipografia.nombreCard, marginBottom: espaciado.xs },
  pagoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.xs + 1,
    marginTop: 3,
  },
  pagoMetaTexto: { ...tipografia.secundario, flex: 1 },
  pagoMonto: { ...tipografia.monto, color: colors.doradoTexto, paddingLeft: espaciado.sm + 4 },
}))
