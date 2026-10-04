import { useState } from 'react'
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { ConfirmModal, FormularioCliente, SuccessModal } from '../components'
import { useToast } from '../components/ToastProvider'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import useConfirmarSalida from '../lib/useConfirmarSalida'

export default function NuevoClienteScreen({ navigation }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const mostrarToast = useToast()
  const [loading, setLoading] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [sucio, setSucio] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const salida = useConfirmarSalida(navigation, sucio && !guardado)

  async function guardarCliente(valores) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: perfil, error: errorPerfil } = await supabase
      .from('profiles')
      .select('limite_clientes')
      .eq('id', user.id)
      .single()

    const { data: clientesData, error: errorClientes } = await supabase
      .from('clientes')
      .select('id')
      .eq('abogado_id', user.id)

    if (errorPerfil || errorClientes || !perfil || !clientesData) {
      setLoading(false)
      mostrarToast('No se pudo verificar el límite de tu plan. Intentá de nuevo.')
      return
    }

    if (clientesData.length >= perfil.limite_clientes) {
      setLoading(false)
      mostrarToast(`Alcanzaste el límite de ${perfil.limite_clientes} clientes de tu plan.`)
      return
    }

    const { error } = await supabase.from('clientes').insert({
      abogado_id: user.id,
      ...valores,
    })
    setLoading(false)
    if (error) mostrarToast(error.message)
    else {
      setGuardado(true)
      setSuccessModal(true)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <ConfirmModal
          visible={salida.visible}
          titulo="Descartar cambios"
          mensaje="Tenés cambios sin guardar. ¿Querés salir y perderlos?"
          textoBoton="Sí, salir"
          textoCancelar="Seguir editando"
          onConfirmar={salida.confirmar}
          onCancelar={salida.cancelar}
        />

        <SuccessModal
          visible={successModal}
          titulo="¡Cliente registrado!"
          mensaje="El cliente fue agregado correctamente."
          onCerrar={() => {
            setSuccessModal(false)
            navigation.goBack()
          }}
        />

        <FormularioCliente
          textoBoton="Registrar Cliente"
          loading={loading}
          onSucioChange={setSucio}
          onGuardar={guardarCliente}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const usarEstilos = crearEstilos((colors) => ({
  container: { flex: 1, backgroundColor: colors.fondo },
  // El espacio extra abajo deja el botón de guardar alcanzable con el teclado abierto.
  contenido: { padding: espaciado.lg, paddingBottom: espaciado.xxl + espaciado.xl },
}))
