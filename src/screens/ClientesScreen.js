import { useEffect, useMemo, useState } from 'react'
import {
  View, Text, FlatList, Animated, RefreshControl,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { formatMonto } from '../lib/utils'
import { crearEstilos, radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import {
  Boton, CampoTexto, Card, Chip, EstadoError, EstadoVacio, SkeletonLista,
} from '../components'
import { useToast } from '../components/ToastProvider'
import { Menu } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'

const ESTADOS = ['Todos', 'Activo', 'En espera', 'Cerrado']

// El orden se aplica sobre la lista ya traída: el saldo pendiente se calcula en
// el cliente (monto_total menos la suma de pagos), así que Postgres no lo puede
// ordenar sin una vista.
const ORDENES = [
  { id: 'reciente', label: 'Más recientes', icono: 'clock-outline', comparar: null },
  { id: 'deuda', label: 'Más deuda', icono: 'trending-down', comparar: (a, b) => b.pendiente - a.pendiente },
  { id: 'monto', label: 'Mayor monto', icono: 'cash', comparar: (a, b) => b.monto_total - a.monto_total },
  {
    id: 'nombre',
    label: 'Nombre (A-Z)',
    icono: 'sort-alphabetical-ascending',
    comparar: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  },
]

// Tope de tarjetas que escalonan su entrada: sin esto, con 30 clientes la última
// tardaba más de dos segundos en aparecer.
const MAX_ESCALONADO = 6


function colorEstado(colors, estado) {
  if (estado === 'Activo') return colors.exito
  if (estado === 'En espera') return colors.advertencia
  if (estado === 'Cerrado') return colors.grisInactivo
  return colors.grisInactivo
}

function ClienteCard({ item, onPress, index }) {
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

  const translateY = entrada.interpolate({ inputRange: [0, 1], outputRange: [30, 0] })

  return (
    <Animated.View style={{ opacity: entrada, transform: [{ translateY }] }}>
      <Card
        onPress={onPress}
        style={styles.card}
        accessibilityLabel={
          `${item.nombre}. ${item.estado || 'Activo'}. ` +
          (item.pendiente > 0
            ? `Pendiente ${formatMonto(item.pendiente)} bolivianos`
            : 'Pagado')
        }
      >
        <View style={styles.cardContenido}>
          <View style={styles.cardHeader}>
            <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
            <View style={[styles.estadoBadge, { backgroundColor: colorEstado(colors, item.estado) }]}>
              <Text style={styles.estadoBadgeText}>{item.estado || 'Activo'}</Text>
            </View>
          </View>
          {item.descripcion_caso ? (
            <Text style={styles.caso} numberOfLines={1}>{item.descripcion_caso}</Text>
          ) : null}
          <View style={styles.montos}>
            <View style={styles.montoItem}>
              <Text style={styles.montoLabel}>Total</Text>
              <Text style={styles.montoValor}>Bs. {formatMonto(item.monto_total)}</Text>
            </View>
            <View style={styles.separadorVertical} />
            <View style={styles.montoItem}>
              <Text style={styles.montoLabel}>
                {item.pendiente > 0 ? 'Pendiente' : 'Estado'}
              </Text>
              <Text style={[styles.montoValor, {
                color: item.pendiente > 0 ? colors.error : colors.exito
              }]}>
                {item.pendiente > 0 ? `Bs. ${formatMonto(item.pendiente)}` : '✓ Pagado'}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.doradoTexto} />
      </Card>
    </Animated.View>
  )
}

export default function ClientesScreen({ navigation }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const mostrarToast = useToast()
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [orden, setOrden] = useState('reciente')
  const [menuOrden, setMenuOrden] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [falloCarga, setFalloCarga] = useState(false)

  useEffect(() => {
    fetchClientes()
    const unsubscribe = navigation.addListener('focus', () => fetchClientes())
    return unsubscribe
  }, [navigation])

  const filtrados = useMemo(() => {
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
    // 'reciente' es el orden con el que llega la consulta, así que no reordena.
    const criterio = ORDENES.find((o) => o.id === orden)
    if (criterio?.comparar) {
      resultado = [...resultado].sort(criterio.comparar)
    }
    return resultado
  }, [busqueda, clientes, estadoFiltro, orden])

  async function fetchClientes({ esRefresco = false } = {}) {
    if (esRefresco) setRefrescando(true)
    else setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: clientesData, error } = await supabase
      .from('clientes')
      .select('*, pagos(monto)')
      .eq('abogado_id', user.id)
      .order('fecha_registro', { ascending: false })

    if (error || !clientesData) {
      mostrarToast('No se pudieron cargar los clientes')
      setFalloCarga(true)
    } else {
      const clientesConSaldo = clientesData.map((c) => {
        const totalPagado = (c.pagos || []).reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
        const pendiente = parseFloat(c.monto_total || 0) - totalPagado
        return { ...c, totalPagado, pendiente }
      })
      setClientes(clientesConSaldo)
      setFalloCarga(false)
    }
    setLoading(false)
    setRefrescando(false)
  }

  if (falloCarga && clientes.length === 0) {
    return (
      <EstadoError
        mensaje="No se pudieron cargar los clientes"
        onReintentar={() => fetchClientes()}
      />
    )
  }

  const hayFiltros = busqueda.trim() !== '' || estadoFiltro !== 'Todos'
  const ordenActivo = ORDENES.find((o) => o.id === orden) || ORDENES[0]

  function limpiarFiltros() {
    setBusqueda('')
    setEstadoFiltro('Todos')
  }

  return (
    <View style={styles.container}>
      {/* Buscador y filtros */}
      <View style={styles.filtroContainer}>
        <CampoTexto
          placeholder="Buscar por nombre, caso o teléfono..."
          accessibilityLabel="Buscar clientes"
          value={busqueda}
          onChangeText={setBusqueda}
          style={styles.buscador}
          iconoIzquierda="magnify"
          iconoDerecha={busqueda ? 'close' : undefined}
          onPressIconoDerecha={() => setBusqueda('')}
        />
        <View style={styles.filtroEstados}>
          {ESTADOS.map((e) => (
            <Chip
              key={e}
              label={e}
              activo={estadoFiltro === e}
              onPress={() => setEstadoFiltro(e)}
            />
          ))}

          <Menu
            visible={menuOrden}
            onDismiss={() => setMenuOrden(false)}
            anchor={
              <Chip
                label={ordenActivo.label}
                icono="swap-vertical"
                iconoFin={menuOrden ? 'chevron-up' : 'chevron-down'}
                activo={orden !== 'reciente'}
                onPress={() => setMenuOrden(true)}
              />
            }
            contentStyle={styles.menu}
          >
            {ORDENES.map((o) => (
              <Menu.Item
                key={o.id}
                title={o.label}
                leadingIcon={o.icono}
                trailingIcon={orden === o.id ? 'check' : undefined}
                titleStyle={[styles.menuItem, orden === o.id && styles.menuItemActivo]}
                onPress={() => {
                  setOrden(o.id)
                  setMenuOrden(false)
                }}
              />
            ))}
          </Menu>
        </View>
      </View>

      {/* Contador */}
      <View style={styles.contadorContainer}>
        <Text style={styles.contadorText}>
          {filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <SkeletonLista />
      ) : (
        <FlatList
          key={`${estadoFiltro}-${orden}`}
          data={filtrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ClienteCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('DetalleCliente', { cliente: item })}
            />
          )}
          ListEmptyComponent={
            hayFiltros ? (
              <EstadoVacio
                icono="search-outline"
                mensaje="No se encontraron resultados"
                detalle="Probá con otro texto o quitá los filtros."
                accion={{
                  label: 'Limpiar filtros',
                  icono: 'close-outline',
                  onPress: limpiarFiltros,
                }}
              />
            ) : (
              <EstadoVacio
                icono="people-outline"
                mensaje="Todavía no tenés clientes"
                detalle="Registrá el primero para empezar a llevar sus pagos."
                accion={{
                  label: 'Registrar primer cliente',
                  icono: 'person-add-outline',
                  onPress: () => navigation.navigate('NuevoCliente'),
                }}
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => fetchClientes({ esRefresco: true })}
              colors={[colors.doradoTexto]}
              tintColor={colors.doradoTexto}
            />
          }
          contentContainerStyle={{ padding: espaciado.md, paddingBottom: 90 }}
        />
      )}

      {/* Acción principal */}
      <Boton
        label="Nuevo Cliente"
        icono="add"
        variante="secundario"
        onPress={() => navigation.navigate('NuevoCliente')}
        style={styles.fab}
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
  buscador: { height: 44 },
  filtroEstados: { flexDirection: 'row', gap: espaciado.sm, flexWrap: 'wrap' },
  menu: { backgroundColor: colors.superficie, borderRadius: radios.md },
  menuItem: { ...tipografia.etiqueta, fontSize: 14 },
  menuItemActivo: { color: colors.doradoTexto, fontWeight: '600' },
  contadorContainer: {
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    backgroundColor: colors.fondo,
  },
  contadorText: tipografia.secundario,
  card: {
    marginBottom: espaciado.sm + 2,
    padding: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: espaciado.sm,
  },
  cardContenido: { flex: 1, padding: espaciado.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espaciado.xs,
  },
  nombre: { ...tipografia.nombreCard, flex: 1, marginRight: espaciado.sm },
  estadoBadge: {
    paddingHorizontal: espaciado.sm,
    paddingVertical: 3,
    borderRadius: 12,
  },
  estadoBadgeText: { ...tipografia.micro, color: colors.sobreOscuro, fontWeight: 'bold' },
  caso: { ...tipografia.etiqueta, color: colors.textoSuave, marginBottom: espaciado.sm + 2 },
  montos: { flexDirection: 'row', alignItems: 'center' },
  montoItem: { flex: 1 },
  separadorVertical: {
    width: 1,
    height: 30,
    backgroundColor: colors.borde,
    marginHorizontal: espaciado.sm + 4,
  },
  montoLabel: { ...tipografia.micro, marginBottom: 2 },
  montoValor: tipografia.montoPequeno,
  fab: {
    position: 'absolute',
    // La pantalla está dentro del tab navigator, así que la tab bar ya absorbió
    // el margen seguro de abajo: sumar insets.bottom acá lo contaría dos veces.
    bottom: espaciado.sm + 2,
    left: espaciado.md,
    right: espaciado.md,
    ...sombras.nivel3,
  },
}))
