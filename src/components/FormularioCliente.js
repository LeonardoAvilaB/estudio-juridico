import { useEffect, useRef, useState } from 'react'
import { View, Text } from 'react-native'
import Boton from './Boton'
import CampoTexto from './CampoTexto'
import { crearEstilos, espaciado } from '../lib/theme'
import { useTema } from '../lib/TemaContext'

const ESTADOS = ['Activo', 'En espera', 'Cerrado']

/**
 * Formulario compartido por NuevoClienteScreen y EditarClienteScreen, que hasta
 * ahora repetían los mismos cuatro campos, el selector de estado y el botón.
 *
 * `onGuardar` recibe los valores ya normalizados; la validación de los campos
 * obligatorios se hace acá para que ambas pantallas se comporten igual, y se
 * muestra sobre el campo en vez de en un Alert que tapa el formulario.
 *
 * `onSucioChange` avisa a la pantalla si hay cambios sin guardar, para que
 * pueda confirmar antes de salir.
 */
export default function FormularioCliente({
  inicial = {},
  textoBoton,
  onGuardar,
  onSucioChange,
  loading = false,
}) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)

  const montoInicial =
    inicial.monto_total !== undefined && inicial.monto_total !== null
      ? String(inicial.monto_total)
      : ''

  const [nombre, setNombre] = useState(inicial.nombre || '')
  const [telefono, setTelefono] = useState(inicial.telefono || '')
  const [caso, setCaso] = useState(inicial.descripcion_caso || '')
  const [monto, setMonto] = useState(montoInicial)
  const [estado, setEstado] = useState(inicial.estado || 'Activo')
  const [errores, setErrores] = useState({})

  // Referencias para pasar de un campo al siguiente desde el teclado.
  const refTelefono = useRef(null)
  const refMonto = useRef(null)

  const sucio =
    nombre !== (inicial.nombre || '') ||
    telefono !== (inicial.telefono || '') ||
    caso !== (inicial.descripcion_caso || '') ||
    monto !== montoInicial ||
    estado !== (inicial.estado || 'Activo')

  useEffect(() => {
    if (onSucioChange) onSucioChange(sucio)
  }, [sucio])

  function validar() {
    const nuevos = {}
    if (!nombre.trim()) nuevos.nombre = 'Ingresa el nombre del cliente'
    if (!monto.trim()) nuevos.monto = 'Ingresa el monto del servicio'
    else if (isNaN(parseFloat(monto))) nuevos.monto = 'El monto debe ser un número'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  // Al corregir el campo el error se va solo, sin esperar a reenviar.
  function limpiarError(campo) {
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e))
  }

  function enviar() {
    if (!validar()) return
    onGuardar({
      nombre,
      telefono,
      descripcion_caso: caso,
      monto_total: parseFloat(monto),
      estado,
    })
  }

  return (
    <View>
      <CampoTexto
        label="Nombre completo *"
        value={nombre}
        onChangeText={(t) => { setNombre(t); limpiarError('nombre') }}
        textoError={errores.nombre}
        returnKeyType="next"
        onSubmitEditing={() => refTelefono.current?.focus()}
      />

      <CampoTexto
        ref={refTelefono}
        label="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        returnKeyType="next"
        onSubmitEditing={() => refMonto.current?.focus()}
      />

      {/* La descripción queda fuera del encadenado: es multilínea, así que la
          tecla de retorno tiene que insertar un salto y no cambiar de campo. */}
      <CampoTexto
        label="Descripción del caso"
        value={caso}
        onChangeText={setCaso}
        multilinea
      />

      <CampoTexto
        ref={refMonto}
        label="Monto del servicio (Bs.) *"
        value={monto}
        onChangeText={(t) => { setMonto(t); limpiarError('monto') }}
        keyboardType="numeric"
        textoError={errores.monto}
        returnKeyType="done"
        onSubmitEditing={enviar}
      />

      <Text style={styles.label}>Estado del caso</Text>
      <View style={styles.estados}>
        {ESTADOS.map((e) => (
          <Boton
            key={e}
            label={e}
            variante={estado === e ? 'primario' : 'neutro'}
            onPress={() => setEstado(e)}
            compacto
            style={[styles.estadoBtn, estado !== e && styles.estadoBtnInactivo]}
          />
        ))}
      </View>

      <Boton
        label={textoBoton}
        labelCargando="Guardando..."
        loading={loading}
        onPress={enviar}
      />
    </View>
  )
}

const usarEstilos = crearEstilos((colors, tipografia) => ({
  label: {
    ...tipografia.etiquetaFuerte,
    fontSize: 14,
    marginBottom: espaciado.sm,
    marginTop: espaciado.xs,
  },
  estados: { flexDirection: 'row', gap: espaciado.sm + 2, marginBottom: espaciado.lg },
  estadoBtn: { flex: 1, paddingHorizontal: espaciado.sm },
  estadoBtnInactivo: { backgroundColor: colors.superficie },
}))
