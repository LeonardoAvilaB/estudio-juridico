import { useEffect, useRef, useState } from 'react'
import { View, Text, Platform, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import Boton from './Boton'
import CampoTexto from './CampoTexto'
import { crearEstilos, radios, espaciado, TOUCH_MIN } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import { aFechaDB, formatearFechaCorta } from '../lib/fechas'
import { formatMonto } from '../lib/utils'

const TIPOS_PAGO = [
  { valor: 'Efectivo', icono: 'cash-outline' },
  { valor: 'QR', icono: 'qr-code-outline' },
]

/**
 * Formulario compartido por NuevoPagoScreen y EditarPagoScreen: monto, fecha,
 * tipo de pago y notas.
 *
 * `saldoPendiente` es opcional: si se pasa, avisa cuando el monto lo supera. Es
 * un aviso y no un bloqueo, porque un adelanto es legítimo; lo que evita es que
 * un cero de más entre sin que nadie lo note.
 *
 * `onSucioChange` avisa a la pantalla si hay cambios sin guardar.
 */
export default function FormularioPago({
  inicial = {},
  textoBoton,
  onGuardar,
  onSucioChange,
  saldoPendiente,
  loading = false,
}) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const montoInicial =
    inicial.monto !== undefined && inicial.monto !== null ? String(inicial.monto) : ''
  const fechaInicial = inicial.fecha || new Date()

  const [monto, setMonto] = useState(montoInicial)
  const [fecha, setFecha] = useState(fechaInicial)
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const [notas, setNotas] = useState(inicial.notas || '')
  const [tipoPago, setTipoPago] = useState(inicial.tipo_pago || 'Efectivo')
  const [errorMonto, setErrorMonto] = useState(null)

  const refNotas = useRef(null)

  const sucio =
    monto !== montoInicial ||
    notas !== (inicial.notas || '') ||
    tipoPago !== (inicial.tipo_pago || 'Efectivo') ||
    aFechaDB(fecha) !== aFechaDB(fechaInicial)

  useEffect(() => {
    if (onSucioChange) onSucioChange(sucio)
  }, [sucio])

  const montoNumero = parseFloat(monto)
  const excedeSaldo =
    saldoPendiente !== undefined &&
    saldoPendiente !== null &&
    !isNaN(montoNumero) &&
    montoNumero > saldoPendiente

  function enviar() {
    // Antes un monto vacío hacía un `return` mudo: el botón no respondía y no
    // había forma de saber por qué.
    if (!monto.trim()) {
      setErrorMonto('Ingresa el monto del pago')
      return
    }
    if (isNaN(parseFloat(monto))) {
      setErrorMonto('El monto debe ser un número')
      return
    }
    onGuardar({
      monto: parseFloat(monto),
      fecha_pago: aFechaDB(fecha),
      notas,
      tipo_pago: tipoPago,
    })
  }

  return (
    <View>
      {mostrarCalendario && (
        <DateTimePicker
          value={fecha}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={(_evento, fechaElegida) => {
            setMostrarCalendario(false)
            setFecha(fechaElegida)
          }}
          onDismiss={() => setMostrarCalendario(false)}
        />
      )}

      <CampoTexto
        label="Monto (Bs.) *"
        value={monto}
        onChangeText={(t) => { setMonto(t); setErrorMonto(null) }}
        keyboardType="numeric"
        iconoIzquierda="currency-usd"
        colorIconoIzquierda={colors.doradoTexto}
        textoError={errorMonto}
        textoAviso={
          excedeSaldo
            ? `Supera el saldo pendiente de Bs. ${formatMonto(saldoPendiente)}`
            : undefined
        }
        returnKeyType="next"
        onSubmitEditing={() => refNotas.current?.focus()}
      />

      <Text style={styles.label}>Fecha del pago *</Text>
      <TouchableOpacity
        style={styles.fechaBtn}
        onPress={() => setMostrarCalendario(true)}
        accessibilityRole="button"
        accessibilityLabel={`Fecha del pago: ${formatearFechaCorta(aFechaDB(fecha))}`}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.doradoTexto} />
        <Text style={styles.fechaBtnText}>{formatearFechaCorta(aFechaDB(fecha))}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textoSuave} />
      </TouchableOpacity>

      <Text style={styles.label}>Tipo de pago *</Text>
      <View style={styles.tipos}>
        {TIPOS_PAGO.map(({ valor, icono }) => (
          <Boton
            key={valor}
            label={valor}
            icono={icono}
            variante={tipoPago === valor ? 'primario' : 'neutro'}
            onPress={() => setTipoPago(valor)}
            style={[styles.tipoBtn, tipoPago !== valor && styles.tipoBtnInactivo]}
          />
        ))}
      </View>

      <CampoTexto
        ref={refNotas}
        label="Notas (opcional)"
        value={notas}
        onChangeText={setNotas}
        multilinea
      />

      <Boton
        label={textoBoton}
        labelCargando="Guardando..."
        loading={loading}
        icono="checkmark-circle-outline"
        onPress={enviar}
      />
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  label: {
    ...tipografia.etiquetaFuerte,
    fontSize: 14,
    marginBottom: espaciado.sm,
    marginTop: espaciado.xs,
  },
  fechaBtn: {
    minHeight: TOUCH_MIN,
    backgroundColor: colors.superficie,
    padding: espaciado.sm + 6,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colors.borde,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm + 2,
    marginBottom: espaciado.sm + 4,
  },
  fechaBtnText: { ...tipografia.cuerpo, flex: 1 },
  tipos: { flexDirection: 'row', gap: espaciado.sm + 4, marginBottom: espaciado.md },
  tipoBtn: { flex: 1 },
  tipoBtnInactivo: { backgroundColor: colors.superficie },
}))
