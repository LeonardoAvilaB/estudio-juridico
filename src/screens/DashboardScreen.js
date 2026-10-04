import { useEffect, useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  FlatList, Modal, useWindowDimensions, KeyboardAvoidingView, Platform, Animated,
  RefreshControl,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { formatMonto } from '../lib/utils'
import { crearEstilos, radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import { parsearFechaDB } from '../lib/fechas'
import {
  BarraSegmentada, Boton, Card, Chip, EstadoError, EstadoVacio, HeroCard, SeccionTitulo,
  SelectorMes, Skeleton,
} from '../components'
import { useToast } from '../components/ToastProvider'
import { Ionicons } from '@expo/vector-icons'
import { LineChart } from 'react-native-gifted-charts'

const PERIODOS = [
  { id: 'mes', label: 'Este mes' },
  { id: 'mes_anterior', label: 'Mes anterior' },
  { id: 'anio', label: 'Este año' },
  { id: 'todo', label: 'Todo' },
]

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Los colores de cada acceso salen de la paleta activa, así que se arma en el
// render y no como constante de módulo.
function crearAccesos(colors) {
  return [
    {
      id: 'nuevoCliente',
      icono: 'person-add-outline',
      color: colors.doradoTexto,
      fondo: colors.doradoFondo,
      titulo: 'Nuevo cliente',
      subtitulo: 'Registrar un nuevo cliente',
    },
    {
      id: 'registrarPago',
      icono: 'cash-outline',
      color: colors.exito,
      fondo: colors.exitoFondo,
      titulo: 'Registrar pago',
      subtitulo: 'Busca un cliente y registra su pago',
    },
    {
      id: 'pagosRecientes',
      icono: 'receipt-outline',
      color: colors.info,
      fondo: colors.infoFondo,
      titulo: 'Pagos recientes',
      subtitulo: 'Ver historial de pagos registrados',
    },
    {
      id: 'clientesPendientes',
      icono: 'alert-circle-outline',
      color: colors.error,
      fondo: colors.errorFondo,
      titulo: 'Clientes pendientes',
      subtitulo: 'Ver clientes con saldo por cobrar',
    },
  ]
}

/**
 * Entrada de una cifra grande: sube y aparece.
 *
 * Antes era un contador que animaba el número desde cero. Se veía bien, pero en
 * React Native no se puede animar texto en el hilo nativo: había que escuchar el
 * valor y hacer `setState` en cada frame, o sea ~60 re-renders por segundo del
 * hero. Esta versión anima opacidad y desplazamiento con `useNativeDriver`, así
 * que no cuesta ningún render y lee igual de bien.
 */
function CifraAnimada({ valor, style }) {
  const [entrada] = useState(() => new Animated.Value(0))

  useEffect(() => {
    entrada.setValue(0)
    Animated.timing(entrada, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start()
  }, [valor])

  const translateY = entrada.interpolate({ inputRange: [0, 1], outputRange: [10, 0] })

  return (
    <Animated.View style={{ opacity: entrada, transform: [{ translateY }] }}>
      {/* La cifra puede llegar a siete dígitos: se ajusta antes de desbordar. */}
      <Text style={style} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        Bs. {formatMonto(valor)}
      </Text>
    </Animated.View>
  )
}

function SkeletonResumen() {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <View style={styles.skeleton}>
      <View style={styles.periodoContainer}>
        {[72, 88, 72, 52].map((ancho, i) => (
          <Skeleton key={i} ancho={ancho} alto={28} radio={radios.xl} />
        ))}
      </View>

      <View style={styles.skeletonHero}>
        <Skeleton ancho={130} alto={11} />
        <Skeleton ancho="65%" alto={32} style={{ marginTop: espaciado.sm + 4 }} />
        <Skeleton ancho="45%" alto={11} style={{ marginTop: espaciado.sm }} />
      </View>

      {[0, 1].map((i) => (
        <Card key={i} sinAcento radio={radios.lg} style={styles.bloque}>
          <Skeleton ancho="45%" alto={13} />
          <Skeleton ancho="100%" alto={10} radio={radios.sm} style={{ marginTop: espaciado.md }} />
          <Skeleton ancho="70%" alto={11} style={{ marginTop: espaciado.sm + 4 }} />
        </Card>
      ))}

      <Card sinAcento radio={radios.lg} style={styles.bloque}>
        <Skeleton ancho="50%" alto={13} />
        <Skeleton ancho="100%" alto={180} radio={radios.md} style={{ marginTop: espaciado.md }} />
      </Card>
    </View>
  )
}

/**
 * Baldosa de acceso rápido.
 *
 * Antes eran cuatro filas idénticas de ancho completo que se comían el último
 * tercio de la pantalla y obligaban a scrollear. En grilla de dos columnas
 * entran en la mitad del espacio y se recorren de un vistazo.
 */
function AccesoRapido({ acceso, onPress }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)

  return (
    <Card
      onPress={onPress}
      nivel={1}
      style={styles.acceso}
      accessibilityRole="button"
      accessibilityLabel={`${acceso.titulo}. ${acceso.subtitulo}`}
    >
      <View style={[styles.accesoIcono, { backgroundColor: acceso.fondo }]}>
        <Ionicons name={acceso.icono} size={20} color={acceso.color} />
      </View>
      <Text style={styles.accesoTitulo} numberOfLines={1}>{acceso.titulo}</Text>
      <Text style={styles.accesoSubtitulo} numberOfLines={2}>{acceso.subtitulo}</Text>
    </Card>
  )
}

export default function DashboardScreen({ navigation }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  // Se lee en el render y no al importar el módulo, para que el gráfico siga el
  // ancho real al rotar el dispositivo o redimensionar la ventana en web.
  const { width: screenWidth } = useWindowDimensions()
  const anchoGrafico = useMemo(() => {
    const interior = screenWidth - 4 * espaciado.md - 40
    return {
      inicial: 12,
      paso: Math.max((interior - 12) / (MESES.length - 1), 16),
    }
  }, [screenWidth])
  const mostrarToast = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [periodo, setPeriodo] = useState('mes')
  const [graficoData, setGraficoData] = useState(null)
  const [modalPago, setModalPago] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [todosClientes, setTodosClientes] = useState([])
  // Mes que sigue el deslizador del gráfico; arranca en el mes en curso.
  const [mesGrafico, setMesGrafico] = useState(() => new Date().getMonth())

  useEffect(() => {
    fetchStats()
    const unsubscribe = navigation.addListener('focus', () => fetchStats())
    return unsubscribe
  }, [navigation, periodo])

  const clientesFiltrados = useMemo(() => {
    if (busqueda.trim() === '') return []
    const texto = busqueda.toLowerCase()
    return todosClientes.filter(c => c.nombre.toLowerCase().includes(texto))
  }, [busqueda, todosClientes])

  async function fetchStats({ esRefresco = false } = {}) {
    if (esRefresco) setRefrescando(true)
    else setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: clientes } = await supabase
        .from('clientes')
        .select('*')
        .eq('abogado_id', user.id)
      const { data: misPagos, error: errorPagos } = await supabase
        .from('pagos')
        .select('*, clientes!inner(abogado_id)')
        .eq('clientes.abogado_id', user.id)

      if (errorPagos || !clientes || !misPagos) {
        throw new Error('No se pudo cargar el resumen')
      }
      setTodosClientes(clientes)

      const hoy = new Date()
      const mesActual = hoy.getMonth()
      const anioActual = hoy.getFullYear()

      let pagosFiltrados = misPagos
      if (periodo === 'mes') {
        pagosFiltrados = misPagos.filter(p => {
          const f = parsearFechaDB(p.fecha_pago)
          return f.getMonth() === mesActual && f.getFullYear() === anioActual
        })
      } else if (periodo === 'mes_anterior') {
        const mesPasado = mesActual === 0 ? 11 : mesActual - 1
        const anioPasado = mesActual === 0 ? anioActual - 1 : anioActual
        pagosFiltrados = misPagos.filter(p => {
          const f = parsearFechaDB(p.fecha_pago)
          return f.getMonth() === mesPasado && f.getFullYear() === anioPasado
        })
      } else if (periodo === 'anio') {
        pagosFiltrados = misPagos.filter(p => {
          const f = parsearFechaDB(p.fecha_pago)
          return f.getFullYear() === anioActual
        })
      }

      const totalCobrado = clientes.reduce((sum, c) => sum + parseFloat(c.monto_total || 0), 0)
      const totalRecaudado = pagosFiltrados.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
      const casosActivos = clientes.filter(c => c.estado === 'Activo').length
      const casosCerrados = clientes.filter(c => c.estado === 'Cerrado').length
      const casosEspera = clientes.filter(c => c.estado === 'En espera').length
      const totalRecaudadoGeneral = misPagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
      const porCobrar = totalCobrado - totalRecaudadoGeneral

      setStats({
        totalCobrado, totalRecaudado, totalRecaudadoGeneral, porCobrar,
        casosActivos, casosCerrados, casosEspera,
        totalClientes: clientes.length,
        // Del período: alimentan el subtítulo y las cifras de apoyo del hero.
        cantidadPagos: pagosFiltrados.length,
        promedioPago: pagosFiltrados.length ? totalRecaudado / pagosFiltrados.length : 0,
      })

      const datosPorMes = Array(12).fill(0)
      misPagos.forEach(p => {
        const f = parsearFechaDB(p.fecha_pago)
        if (f.getFullYear() === anioActual) {
          datosPorMes[f.getMonth()] += parseFloat(p.monto || 0)
        }
      })
      setGraficoData(datosPorMes)
    } catch (e) {
      mostrarToast(e.message)
      setStats(null)
    }
    setLoading(false)
    setRefrescando(false)
  }

  function cerrarModalPago() {
    setModalPago(false)
    setBusqueda('')
  }

  function irA(accesoId) {
    if (accesoId === 'nuevoCliente') navigation.navigate('ClientesTab', { screen: 'NuevoCliente' })
    else if (accesoId === 'registrarPago') setModalPago(true)
    else if (accesoId === 'pagosRecientes') navigation.navigate('PagosRecientes')
    else if (accesoId === 'clientesPendientes') navigation.navigate('ClientesPendientes')
  }

  if (loading) return <SkeletonResumen />

  // Sin stats no hay nada que renderizar: antes se seguía de largo y explotaba.
  if (!stats) {
    return (
      <EstadoError
        mensaje="No se pudo cargar el resumen"
        onReintentar={() => fetchStats()}
      />
    )
  }

  const labelPeriodo = PERIODOS.find(p => p.id === periodo)?.label || ''
  const pctCobrado = stats.totalCobrado > 0
    ? Math.round((stats.totalRecaudadoGeneral / stats.totalCobrado) * 100)
    : 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: espaciado.md }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => fetchStats({ esRefresco: true })}
          colors={[colors.doradoTexto]}
          tintColor={colors.doradoTexto}
        />
      }
    >

      {/* Modal registro rápido de pago */}
      <Modal visible={modalPago} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={cerrarModalPago}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalContainer}
              accessible={false}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitulo}>Registrar pago rápido</Text>
              <Text style={styles.modalSubtitulo}>Busca el cliente por nombre</Text>
              <View style={styles.buscadorContainer}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.doradoTexto}
                  style={{ marginLeft: espaciado.sm + 4 }}
                />
                <TextInput
                  style={styles.buscadorInput}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Escribe el nombre del cliente..."
                  placeholderTextColor={colors.inputPlaceholder}
                  accessibilityLabel="Buscar cliente por nombre"
                  autoFocus
                />
              </View>
              {clientesFiltrados.length > 0 && (
                <FlatList
                  data={clientesFiltrados}
                  keyExtractor={item => item.id}
                  style={styles.listaClientes}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.clienteItem}
                      onPress={() => {
                        cerrarModalPago()
                        navigation.navigate('ClientesTab', {
                          screen: 'NuevoPago',
                          params: { clienteId: item.id }
                        })
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Registrar pago de ${item.nombre}`}
                    >
                      <View style={styles.clienteItemLinea} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.clienteItemNombre}>{item.nombre}</Text>
                        {item.descripcion_caso ? (
                          <Text style={styles.clienteItemCaso} numberOfLines={1}>{item.descripcion_caso}</Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.doradoTexto} />
                    </TouchableOpacity>
                  )}
                />
              )}
              {busqueda.length > 0 && clientesFiltrados.length === 0 && (
                <EstadoVacio icono="search-outline" mensaje="No se encontraron clientes" />
              )}
              <Boton label="Cancelar" variante="neutro" compacto onPress={cerrarModalPago} />
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Filtro de período */}
      <View style={styles.periodoContainer}>
        {PERIODOS.map(p => (
          <Chip
            key={p.id}
            label={p.label}
            activo={periodo === p.id}
            onPress={() => setPeriodo(p.id)}
            fondoInactivo={colors.superficie}
          />
        ))}
      </View>

      {/* Métrica del período: la única cifra que responde al filtro de arriba */}
      <HeroCard
        etiqueta={`Recaudado · ${labelPeriodo}`}
        icono="trending-up-outline"
        subtitulo={
          stats.cantidadPagos === 0
            ? 'Sin pagos registrados en el período'
            : `${stats.cantidadPagos} pago${stats.cantidadPagos !== 1 ? 's' : ''} en el período`
        }
        secundarias={[
          { label: 'Pagos', valor: stats.cantidadPagos },
          { label: 'Promedio por pago', valor: `Bs. ${formatMonto(stats.promedioPago)}` },
        ]}
        style={styles.hero}
      >
        <CifraAnimada valor={stats.totalRecaudado} style={styles.heroCifra} />
      </HeroCard>

      {/* Cartera acumulada: no depende del filtro, por eso va en su propio bloque */}
      <Card sinAcento radio={radios.lg} style={styles.bloque}>
        <View style={styles.bloqueHeader}>
          <View>
            <Text style={styles.bloqueTitulo}>Cartera total</Text>
            <Text style={styles.bloqueNota}>Acumulado histórico</Text>
          </View>
          <Text style={styles.bloqueCifra}>Bs. {formatMonto(stats.totalCobrado)}</Text>
        </View>
        <BarraSegmentada
          conPorcentaje
          segmentos={[
            { label: 'Cobrado', valor: stats.totalRecaudadoGeneral, color: colors.dorado },
            { label: 'Por cobrar', valor: stats.porCobrar, color: colors.error },
          ]}
        />
        <Text style={styles.bloquePie}>
          Bs. {formatMonto(stats.totalRecaudadoGeneral)} de Bs. {formatMonto(stats.totalCobrado)}
          {stats.totalCobrado > 0 ? ` · ${pctCobrado}% de la cartera cobrada` : ''}
        </Text>
      </Card>

      {/* Casos por estado */}
      <Card sinAcento radio={radios.lg} style={styles.bloque}>
        <View style={styles.bloqueHeader}>
          <View>
            <Text style={styles.bloqueTitulo}>Casos por estado</Text>
            <Text style={styles.bloqueNota}>Todos los clientes</Text>
          </View>
          <Text style={styles.bloqueCifra}>
            {stats.totalClientes} cliente{stats.totalClientes !== 1 ? 's' : ''}
          </Text>
        </View>
        <BarraSegmentada
          segmentos={[
            { label: 'Activos', valor: stats.casosActivos, color: colors.exito },
            { label: 'En espera', valor: stats.casosEspera, color: colors.advertencia },
            { label: 'Cerrados', valor: stats.casosCerrados, color: colors.grisInactivo },
          ]}
        />
      </Card>

      {/* Gráfico */}
      {graficoData && (
        <Card sinAcento radio={radios.lg} style={styles.bloque}>
          <View style={styles.bloqueHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bloqueTitulo}>Pagos por mes</Text>
              {/* El histórico es del año calendario y no sigue al filtro de
                  período de arriba, así que el rótulo lo dice explícito. */}
              <Text style={styles.bloqueNota}>
                Histórico {new Date().getFullYear()} · Bs.{' '}
                {formatMonto(graficoData.reduce((sum, v) => sum + v, 0))} en el año
              </Text>
            </View>

            {/* Lectura del mes que marca el deslizador. */}
            <View style={styles.lecturaMes}>
              <Text style={styles.lecturaMesNombre}>{MESES_LARGOS[mesGrafico]}</Text>
              <Text style={styles.bloqueCifra}>
                Bs. {formatMonto(graficoData[mesGrafico] || 0)}
              </Text>
            </View>
          </View>

          {/* Línea con área en vez de 12 barras: la tendencia se lee de un
              golpe, y no hay ancho fijo por barra que no entre en pantalla.
              El mes activo se marca agrandando su punto. */}
          <LineChart
            data={graficoData.map((value, index) => ({
              value,
              label: MESES[index],
              // Solo primitivas: la librería clona cada objeto anidado del dato
              // y eso rompe con los estilos, que React Native congela en dev.
              dataPointColor: index === mesGrafico ? colors.dorado : colors.oscuroSuave,
              dataPointRadius: index === mesGrafico ? 6 : 3,
            }))}
            areaChart
            curved
            color={colors.dorado}
            thickness={2.5}
            startFillColor={colors.dorado}
            endFillColor={colors.dorado}
            startOpacity={0.35}
            endOpacity={0.02}
            hideDataPoints={false}
            hideRules={false}
            rulesColor={colors.borde}
            rulesType="dashed"
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.borde}
            yAxisTextStyle={styles.ejeTexto}
            xAxisLabelTextStyle={styles.ejeTextoX}
            noOfSections={4}
            maxValue={Math.max(...graficoData) * 1.15 || 100}
            isAnimated
            animationDuration={900}
            initialSpacing={anchoGrafico.inicial}
            spacing={anchoGrafico.paso}
            height={170}
          />

          {/* El deslizador va acá y no sobre el gráfico: el área táctil es más
              grande, se ve solo que es movible, y no compite con el scroll. */}
          <SelectorMes
            etiquetas={MESES}
            indice={mesGrafico}
            onCambiar={setMesGrafico}
          />
        </Card>
      )}

      {/* Accesos rápidos */}
      <SeccionTitulo style={styles.seccionTitulo}>Acceso rápido</SeccionTitulo>
      <View style={styles.accesoGrilla}>
        {crearAccesos(colors).map((acceso) => (
          <AccesoRapido key={acceso.id} acceso={acceso} onPress={() => irA(acceso.id)} />
        ))}
      </View>
      <View style={{ height: espaciado.lg }} />
    </ScrollView>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  container: { flex: 1, backgroundColor: colors.fondo },
  skeleton: { flex: 1, backgroundColor: colors.fondo, padding: espaciado.md },
  skeletonHero: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.lg - 4,
    marginBottom: espaciado.sm + 4,
    ...sombras.nivel2,
  },
  periodoContainer: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginBottom: espaciado.md,
    flexWrap: 'wrap',
  },
  hero: { marginBottom: espaciado.sm + 4 },
  heroCifra: tipografia.heroCifra,
  bloque: { marginBottom: espaciado.sm + 4 },
  bloqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: espaciado.md,
    gap: espaciado.sm,
  },
  bloqueTitulo: tipografia.seccion,
  bloqueNota: { ...tipografia.micro, marginTop: 2 },
  bloqueCifra: { ...tipografia.monto, color: colors.doradoTexto, textAlign: 'right' },
  bloquePie: { ...tipografia.micro, marginTop: espaciado.sm + 4 },
  seccionTitulo: { marginTop: espaciado.sm },
  lecturaMes: { alignItems: 'flex-end' },
  lecturaMesNombre: { ...tipografia.micro, marginBottom: 1 },
  ejeTexto: { color: colors.textoSuave, fontSize: 10 },
  ejeTextoX: { color: colors.textoSuave, fontSize: 9 },
  accesoGrilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.sm + 4,
  },
  acceso: {
    // Dos por fila descontando el gap.
    width: '48%',
    flexGrow: 1,
    gap: espaciado.sm,
  },
  accesoIcono: {
    width: 38,
    height: 38,
    borderRadius: radios.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accesoTitulo: { ...tipografia.seccion, fontSize: 15 },
  accesoSubtitulo: { ...tipografia.micro, lineHeight: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.superficie,
    borderRadius: radios.xl,
    padding: espaciado.lg,
    paddingTop: espaciado.sm + 4,
    maxHeight: '80%',
    ...sombras.nivel4,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borde,
    borderRadius: radios.xs,
    alignSelf: 'center',
    marginBottom: espaciado.md,
  },
  modalTitulo: { ...tipografia.tituloModal, marginBottom: espaciado.xs },
  modalSubtitulo: { ...tipografia.etiqueta, color: colors.textoSuave, marginBottom: espaciado.sm + 4 },
  buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.superficieAlt,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colors.dorado,
    marginBottom: espaciado.sm + 4,
  },
  buscadorInput: {
    flex: 1,
    padding: espaciado.sm + 4,
    ...tipografia.cuerpo,
  },
  listaClientes: { maxHeight: 200, marginBottom: espaciado.sm + 4 },
  clienteItem: {
    padding: espaciado.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm + 2,
  },
  clienteItemLinea: {
    width: 3,
    height: 36,
    backgroundColor: colors.dorado,
    borderRadius: radios.xs,
  },
  clienteItemNombre: { ...tipografia.cuerpoFuerte, fontWeight: 'bold' },
  clienteItemCaso: { ...tipografia.secundario, marginTop: 2 },
}))
