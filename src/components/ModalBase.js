import { View, Modal } from 'react-native'
import { crearEstilos, radios, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Cáscara de los diálogos centrados: fondo oscurecido y tarjeta blanca con el
 * filo dorado arriba. Centraliza el envoltorio que ConfirmModal, SuccessModal y
 * el selector de tipo de pago repetían por separado.
 */
export default function ModalBase({ visible, onCerrar, children, alineado = 'stretch' }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        <View style={[styles.tarjeta, { alignItems: alineado }]}>{children}</View>
      </View>
    </Modal>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.xl,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.lg,
    width: '100%',
    maxWidth: 420,
    borderTopWidth: 4,
    borderTopColor: colors.dorado,
    ...sombras.nivel4,
  },
}))
