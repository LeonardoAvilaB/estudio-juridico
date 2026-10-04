import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, FlatList, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native'
import { supabase } from '../lib/supabase'
import {
  BotonTag, CampoTexto, Card, ConfirmModal, EstadoVacio, SeccionTitulo, SkeletonLista,
} from '../components'
import { useToast } from '../components/ToastProvider'
import { crearEstilos, radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import { Ionicons } from '@expo/vector-icons'

function InputNota({ value, onChange, onAgregar, guardando }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <View style={styles.inputContainer}>
      <CampoTexto
        label="Escribe una nueva nota..."
        value={value}
        onChangeText={onChange}
        multilinea
        blurOnSubmit={false}
        estiloContenedor={styles.textarea}
      />
      <TouchableOpacity
        style={styles.agregarBtn}
        onPress={onAgregar}
        disabled={guardando}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Agregar nota"
      >
        <Ionicons name="add" size={22} color={colors.sobreDorado} />
      </TouchableOpacity>
    </View>
  )
}

export default function NotasClienteScreen({ route }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const { cliente } = route.params
  const mostrarToast = useToast()
  const [notas, setNotas] = useState([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [loading, setLoading] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [modal, setModal] = useState({ visible: false, id: null })

  useEffect(() => {
    fetchNotas()
  }, [])

  async function fetchNotas({ esRefresco = false } = {}) {
    if (esRefresco) setRefrescando(true)
    else setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('notas')
      .select('*, clientes!inner(abogado_id)')
      .eq('cliente_id', cliente.id)
      .eq('clientes.abogado_id', user.id)
      .order('created_at', { ascending: false })
    if (error || !data) mostrarToast('No se pudieron cargar las notas')
    else setNotas(data)
    setLoading(false)
    setRefrescando(false)
  }

  async function agregarNota() {
    if (!nuevaNota.trim()) return
    setGuardando(true)
    const { error } = await supabase.from('notas').insert({
      cliente_id: cliente.id,
      contenido: nuevaNota.trim(),
    })
    setGuardando(false)
    if (error) mostrarToast('No se pudo guardar la nota')
    else {
      setNuevaNota('')
      fetchNotas()
    }
  }

  async function ejecutarEliminar() {
    setModal({ ...modal, visible: false })
    const { error } = await supabase.from('notas').delete().eq('id', modal.id)
    if (error) mostrarToast('No se pudo eliminar la nota')
    else fetchNotas()
  }

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-BO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ConfirmModal
        visible={modal.visible}
        titulo="Eliminar nota"
        mensaje="¿Estás seguro que deseas eliminar esta nota?"
        textoBoton="Sí, eliminar"
        onConfirmar={ejecutarEliminar}
        onCancelar={() => setModal({ ...modal, visible: false })}
      />

      {/* Header del cliente */}
      <View style={styles.header}>
        <View style={styles.headerLinea} />
        <View>
          <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
          <Text style={styles.clienteSubtitulo}>Notas internas del caso</Text>
        </View>
      </View>

      <InputNota
        value={nuevaNota}
        onChange={setNuevaNota}
        onAgregar={agregarNota}
        guardando={guardando}
      />

      <SeccionTitulo icono="time-outline" contador={notas.length} style={styles.historialHeader}>
        Historial de notas
      </SeccionTitulo>

      <FlatList
        data={notas}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: espaciado.md, paddingBottom: espaciado.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => fetchNotas({ esRefresco: true })}
            colors={[colors.doradoTexto]}
            tintColor={colors.doradoTexto}
          />
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonLista cantidad={3} conMontos={false} />
          ) : (
            <EstadoVacio icono="document-text-outline" mensaje="No hay notas registradas" />
          )
        }
        renderItem={({ item }) => (
          <Card nivel={1} style={styles.notaCard} padding={espaciado.sm + 6}>
            <View style={styles.notaHeader}>
              <View style={styles.fechaContainer}>
                <Ionicons name="time-outline" size={12} color={colors.doradoTexto} />
                <Text style={styles.notaFecha}>{formatearFecha(item.created_at)}</Text>
              </View>
              <BotonTag label="Eliminar" onPress={() => setModal({ visible: true, id: item.id })} />
            </View>
            <Text style={styles.notaTexto}>{item.contenido}</Text>
          </Card>
        )}
      />
    </KeyboardAvoidingView>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  container: { flex: 1, backgroundColor: colors.fondo },
  header: {
    backgroundColor: colors.oscuro,
    padding: espaciado.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm + 4,
  },
  headerLinea: {
    width: 4,
    height: 40,
    backgroundColor: colors.dorado,
    borderRadius: radios.xs,
  },
  clienteNombre: { ...tipografia.subtitulo, color: colors.sobreOscuro },
  clienteSubtitulo: { ...tipografia.secundario, color: colors.doradoClaro, marginTop: 2 },
  inputContainer: {
    backgroundColor: colors.superficie,
    padding: espaciado.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
  },
  textarea: { flex: 1, marginBottom: 0 },
  agregarBtn: {
    backgroundColor: colors.dorado,
    width: 46,
    height: 46,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historialHeader: {
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm + 2,
    marginBottom: 0,
  },
  notaCard: { marginBottom: espaciado.sm + 2 },
  notaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espaciado.sm,
  },
  fechaContainer: { flexDirection: 'row', alignItems: 'center', gap: espaciado.xs },
  notaFecha: tipografia.micro,
  notaTexto: tipografia.parrafo,
}))
