import { forwardRef } from 'react'
import { View } from 'react-native'
import { TextInput, HelperText } from 'react-native-paper'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

/**
 * TextInput de Paper con la configuración de marca ya aplicada.
 *
 * Antes cada pantalla repetía el mismo bloque de cinco props (`mode`,
 * `outlineColor`, `activeOutlineColor`, `textColor` y el `theme` con
 * `onSurfaceVariant`) en cada campo: unas catorce veces en total, y cualquier
 * ajuste de color había que replicarlo en todas.
 *
 * Mensajes debajo del campo, en orden de prioridad:
 *   `textoError` marca el borde en rojo y bloquea el envío.
 *   `textoAviso` es informativo: avisa sin impedir guardar.
 *
 * `sobreOscuro` adapta el campo a una superficie negra sin importar el tema
 * activo: lo usa el login, que es negro también en modo claro.
 *
 * Reenvía la ref al input para que un campo pueda darle foco al siguiente.
 *
 * Los iconos se nombran con la nomenclatura de MaterialCommunityIcons, que es la
 * que usa Paper (p. ej. "magnify", "eye-off", "currency-usd").
 */
const CampoTexto = forwardRef(function CampoTexto({
  multilinea = false,
  iconoIzquierda,
  colorIconoIzquierda,
  iconoDerecha,
  onPressIconoDerecha,
  colorIconoDerecha,
  textoError,
  textoAviso,
  sobreOscuro = false,
  style,
  estiloContenedor,
  ...rest
}, ref) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)

  // El fondo del campo no es transparente a propósito: en modo `outlined` Paper
  // usa ese color para tapar la línea del contorno detrás de la etiqueta.
  const paleta = sobreOscuro
    ? {
      fondo: colors.oscuroSuave,
      borde: 'rgba(232, 201, 122, 0.35)',
      texto: colors.sobreOscuro,
      etiqueta: colors.doradoClaro,
      error: colors.errorSobreOscuro,
      icono: colors.doradoClaro,
    }
    : {
      fondo: colors.inputFondo,
      borde: colors.inputBorde,
      texto: colors.texto,
      etiqueta: colors.textoSuave,
      error: colors.error,
      icono: colors.textoSuave,
    }

  return (
    <View style={[styles.contenedor, estiloContenedor]}>
      <TextInput
        ref={ref}
        mode="outlined"
        outlineColor={paleta.borde}
        activeOutlineColor={colors.dorado}
        textColor={paleta.texto}
        theme={{
          colors: {
            onSurfaceVariant: paleta.etiqueta,
            primary: colors.dorado,
            error: paleta.error,
          },
        }}
        error={!!textoError}
        multiline={multilinea}
        numberOfLines={multilinea ? 4 : undefined}
        left={
          iconoIzquierda
            ? <TextInput.Icon icon={iconoIzquierda} color={colorIconoIzquierda || paleta.icono} />
            : undefined
        }
        right={
          iconoDerecha
            ? (
              <TextInput.Icon
                icon={iconoDerecha}
                color={colorIconoDerecha || paleta.icono}
                onPress={onPressIconoDerecha}
              />
            )
            : undefined
        }
        style={[styles.campo, { backgroundColor: paleta.fondo }, multilinea && styles.multilinea, style]}
        {...rest}
      />
      {textoError ? (
        <HelperText type="error" visible padding="none" style={[styles.mensaje, { color: paleta.error }]}>
          {textoError}
        </HelperText>
      ) : textoAviso ? (
        <HelperText type="info" visible padding="none" style={[styles.mensaje, styles.aviso]}>
          {textoAviso}
        </HelperText>
      ) : null}
    </View>
  )
})

export default CampoTexto

const usarEstilos = crearEstilos((colors) => ({
  contenedor: { marginBottom: espaciado.sm + 4 },
  campo: {},
  multilinea: { minHeight: 100 },
  mensaje: { marginTop: -2 },
  aviso: { color: colors.advertencia },
}))
