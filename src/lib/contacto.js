import { Linking } from 'react-native'

/**
 * Abrir el discador con el teléfono del cliente.
 *
 * Solo se quitan los separadores de formato (espacios, guiones, paréntesis) y se
 * conserva el `+`: el discador del sistema tolera casi cualquier formato, así que
 * no hace falta adivinar el código de país ni normalizar más que eso.
 */
export function numeroParaLlamar(telefono) {
  if (!telefono) return null
  const limpio = String(telefono).replace(/[\s()\-.]/g, '')
  // Al menos unos pocos dígitos, para no abrir el discador con basura.
  return /\d{6,}/.test(limpio) ? limpio : null
}

export async function llamar(telefono, onError) {
  const numero = numeroParaLlamar(telefono)
  if (!numero) {
    if (onError) onError('El teléfono guardado no parece válido')
    return
  }
  try {
    await Linking.openURL(`tel:${numero}`)
  } catch {
    if (onError) onError('No se pudo abrir el teléfono')
  }
}
