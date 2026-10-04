import { useEffect, useRef, useState } from 'react'

/**
 * Intercepta el gesto o el botón de volver cuando el formulario tiene cambios
 * sin guardar, para no perder lo cargado por un toque de más.
 *
 * Devuelve `{ visible, confirmar, cancelar }` para enchufarle un ConfirmModal.
 *
 * `activo` debe ser false cuando el formulario está limpio y también después de
 * guardar: si no, el `goBack()` que dispara el modal de éxito quedaría frenado
 * por esta misma confirmación.
 */
export default function useConfirmarSalida(navigation, activo) {
  const [visible, setVisible] = useState(false)
  // La acción de navegación que se frenó, para repetirla si confirma.
  const pendiente = useRef(null)

  useEffect(() => {
    const quitar = navigation.addListener('beforeRemove', (e) => {
      if (!activo) return
      e.preventDefault()
      pendiente.current = e.data.action
      setVisible(true)
    })
    return quitar
  }, [navigation, activo])

  function confirmar() {
    setVisible(false)
    const accion = pendiente.current
    pendiente.current = null
    if (accion) navigation.dispatch(accion)
  }

  function cancelar() {
    setVisible(false)
    pendiente.current = null
  }

  return { visible, confirmar, cancelar }
}
