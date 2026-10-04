import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ModalBase from './ModalBase'
import Boton from './Boton'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

export default function ConfirmModal({
  visible, titulo, mensaje,
  onConfirmar, onCancelar,
  colorBoton,
  textoBoton = 'Eliminar',
  textoCancelar = 'Cancelar',
  icono = 'alert-circle-outline'
}) {
  const { colors, tipografia, sombras } = useTema()
  const colorAccion = colorBoton || colors.error
  const styles = usarEstilos(colors, tipografia, sombras)
  return (
    <ModalBase visible={visible} onCerrar={onCancelar}>
      <View style={styles.iconoContainer}>
        <Ionicons name={icono} size={32} color={colorAccion} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
      <View style={styles.botones}>
        <Boton
          label={textoCancelar}
          variante="neutro"
          onPress={onCancelar}
          compacto
          style={{ flex: 1 }}
        />
        <Boton
          label={textoBoton}
          variante="peligro"
          onPress={onConfirmar}
          compacto
          style={[{ flex: 1 }, { backgroundColor: colorAccion, borderColor: colorAccion }]}
        />
      </View>
    </ModalBase>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  iconoContainer: { alignItems: 'center', marginBottom: espaciado.sm + 4 },
  titulo: { ...tipografia.tituloModal, marginBottom: espaciado.sm, textAlign: 'center' },
  mensaje: {
    ...tipografia.detalle,
    lineHeight: 22,
    marginBottom: espaciado.lg,
    textAlign: 'center',
  },
  botones: { flexDirection: 'row', gap: espaciado.sm + 4 },
}))
