import { View } from 'react-native'
import Boton from './Boton'
import EstadoVacio from './EstadoVacio'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * Pantalla de fallo con reintento.
 *
 * Antes, si la primera carga fallaba, el Dashboard se quedaba con `stats` en
 * null y reventaba al renderizar, y ClientesPendientes ni siquiera llegaba a
 * apagar el `loading`, así que dejaba el skeleton girando para siempre. En los
 * dos casos la única salida era cerrar la app.
 */
export default function EstadoError({
  mensaje = 'No se pudieron cargar los datos',
  detalle = 'Revisá tu conexión e intentá de nuevo.',
  onReintentar,
}) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)

  return (
    <View style={styles.contenedor}>
      <EstadoVacio
        icono="cloud-offline-outline"
        mensaje={mensaje}
        detalle={detalle}
        color={colors.textoSuave}
      />
      {onReintentar ? (
        <Boton
          label="Reintentar"
          icono="refresh-outline"
          onPress={onReintentar}
          style={styles.boton}
        />
      ) : null}
    </View>
  )
}

const usarEstilos = crearEstilos((colors) => ({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  boton: { marginTop: espaciado.sm },
}))
