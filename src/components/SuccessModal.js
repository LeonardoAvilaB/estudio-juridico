import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ModalBase from './ModalBase'
import Boton from './Boton'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

export default function SuccessModal({ visible, titulo, mensaje, onCerrar }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <ModalBase visible={visible} onCerrar={onCerrar} alineado="center">
      <View style={styles.iconoContainer}>
        <View style={styles.iconoCirculo}>
          <Ionicons name="checkmark" size={36} color={colors.sobreDorado} />
        </View>
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
      <Boton label="Aceptar" onPress={onCerrar} style={styles.boton} />
    </ModalBase>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  iconoContainer: { marginBottom: espaciado.md },
  iconoCirculo: {
    width: 70, height: 70,
    borderRadius: 35,
    backgroundColor: colors.dorado,
    justifyContent: 'center',
    alignItems: 'center',
    ...sombras.nivel3,
  },
  titulo: { ...tipografia.titulo, marginBottom: espaciado.sm, textAlign: 'center' },
  mensaje: {
    ...tipografia.detalle,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: espaciado.lg,
  },
  boton: { width: '100%' },
}))
