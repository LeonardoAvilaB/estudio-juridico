import { useState } from 'react'
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { ConfirmModal, FormularioCliente, SuccessModal } from '../components'
import { useToast } from '../components/ToastProvider'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import useConfirmarSalida from '../lib/useConfirmarSalida'

export default function EditarClienteScreen({ route, navigation }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const { cliente } = route.params
  const mostrarToast = useToast()
  const [loading, setLoading] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [sucio, setSucio] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const salida = useConfirmarSalida(navigation, sucio && !guardado)

  async function guardarCambios(valores) {
    setLoading(true)
    const { error } = await supabase
      .from('clientes')
      .update(valores)
      .eq('id', cliente.id)
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
          titulo="¡Cliente actualizado!"
          mensaje="Los datos fueron guardados correctamente."
          onCerrar={() => {
            setSuccessModal(false)
            navigation.goBack()
          }}
        />

        <FormularioCliente
          inicial={cliente}
          textoBoton="Guardar Cambios"
          loading={loading}
          onSucioChange={setSucio}
          onGuardar={guardarCambios}
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
