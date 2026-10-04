import { createContext, useCallback, useContext, useState } from 'react'
import { View, Text } from 'react-native'
import { Snackbar } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { crearEstilos, radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

function estilosTipo(colors) {
  return {
    error: { fondo: colors.error, icono: 'alert-circle', color: colors.sobreOscuro },
    exito: { fondo: colors.exito, icono: 'checkmark-circle', color: colors.sobreOscuro },
    info: { fondo: colors.oscuro, icono: 'information-circle', color: colors.dorado },
  }
}

const ToastContext = createContext(() => {})

/**
 * Devuelve `mostrarToast(mensaje, tipo)`, con tipo 'error' | 'exito' | 'info'.
 *
 * Es el reemplazo de los `Alert.alert` nativos y de los ConfirmModal que se
 * usaban como diálogo de error: un aviso que no interrumpe ni pide un tap para
 * cerrarse. Los modales quedan solo para confirmar acciones destructivas.
 */
export function useToast() {
  return useContext(ToastContext)
}

export default function ToastProvider({ children }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const insets = useSafeAreaInsets()
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'error' })

  const mostrarToast = useCallback((mensaje, tipo = 'error') => {
    setToast({ visible: true, mensaje, tipo })
  }, [])

  const porTipo = estilosTipo(colors)
  const estilo = porTipo[toast.tipo] || porTipo.info

  return (
    <ToastContext.Provider value={mostrarToast}>
      {children}
      <Snackbar
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
        duration={4000}
        // Se levanta por encima de la tab bar para no tapar la navegación.
        wrapperStyle={[styles.wrapper, { bottom: 78 + insets.bottom }]}
        style={[styles.snackbar, { backgroundColor: estilo.fondo }]}
      >
        <View style={styles.contenido}>
          <Ionicons name={estilo.icono} size={18} color={estilo.color} />
          <Text style={[styles.mensaje, { color: estilo.color }]}>{toast.mensaje}</Text>
        </View>
      </Snackbar>
    </ToastContext.Provider>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  wrapper: { paddingHorizontal: espaciado.md },
  snackbar: { borderRadius: radios.md, ...sombras.nivel3 },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espaciado.sm },
  mensaje: { ...tipografia.etiqueta, flex: 1, lineHeight: 19 },
}))
