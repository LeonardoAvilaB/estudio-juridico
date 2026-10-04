import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'
import { BarraProgreso, Boton, CampoTexto, Card, ConfirmModal, SeccionTitulo } from '../components'
import { useToast } from '../components/ToastProvider'
import { crearEstilos, radios, espaciado, TOUCH_MIN } from '../lib/theme'
import { useTema, PREFERENCIAS } from '../lib/TemaContext'
import { Ionicons } from '@expo/vector-icons'

function colorPlan(colors, plan) {
  if (plan === 'basico') return colors.info
  if (plan === 'profesional') return colors.violeta
  if (plan === 'ilimitado') return colors.exito
  return colors.oscuro
}

export default function PerfilScreen() {
  const { colors, tipografia, sombras, preferencia, setPreferencia } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const mostrarToast = useToast()
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [plan, setPlan] = useState('basico')
  const [limiteClientes, setLimiteClientes] = useState(250)
  const [totalClientes, setTotalClientes] = useState(0)
  const [passwordNuevo, setPasswordNuevo] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [verPasswordConfirm, setVerPasswordConfirm] = useState(false)
  const [loadingPerfil, setLoadingPerfil] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)
  const [modalSalir, setModalSalir] = useState(false)
  const [errorNombre, setErrorNombre] = useState(null)
  const [errorPass, setErrorPass] = useState({})

  // La carga vive dentro del efecto: solo se usa acá, y así el guard de montaje
  // evita escribir estado si la pantalla se cierra antes de que llegue Supabase.
  useEffect(() => {
    let montado = true

    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!montado || !user) return
      setEmail(user.email)

      const { data, error } = await supabase
        .from('profiles')
        .select('nombre, telefono, plan, limite_clientes')
        .eq('id', user.id)
        .single()
      if (!montado) return
      if (error) mostrarToast('No se pudo cargar tu perfil')
      if (data) {
        setNombre(data.nombre)
        setTelefono(data.telefono || '')
        setPlan(data.plan || 'basico')
        setLimiteClientes(data.limite_clientes || 250)
      }

      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id')
        .eq('abogado_id', user.id)
      if (!montado) return
      setTotalClientes(clientesData?.length || 0)
    }

    cargarPerfil()
    return () => { montado = false }
  }, [])

  async function actualizarPerfil() {
    if (!nombre.trim()) {
      setErrorNombre('El nombre no puede estar vacío')
      return
    }
    setLoadingPerfil(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ nombre, telefono })
      .eq('id', user.id)
    setLoadingPerfil(false)
    if (error) mostrarToast(error.message)
    else mostrarToast('Tu información fue guardada correctamente.', 'exito')
  }

  async function cambiarPassword() {
    const errores = {}
    if (!passwordNuevo) errores.nueva = 'Ingresa la nueva contraseña'
    else if (passwordNuevo.length < 6) errores.nueva = 'Debe tener al menos 6 caracteres'
    if (!passwordConfirm) errores.confirmar = 'Repite la contraseña'
    else if (passwordNuevo && passwordNuevo !== passwordConfirm) {
      errores.confirmar = 'Las contraseñas no coinciden'
    }
    setErrorPass(errores)
    if (Object.keys(errores).length > 0) return

    setLoadingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passwordNuevo })
    setLoadingPass(false)
    if (error) {
      mostrarToast(error.message)
    } else {
      mostrarToast('Tu contraseña fue cambiada correctamente.', 'exito')
      setPasswordNuevo('')
      setPasswordConfirm('')
    }
  }

  async function cerrarSesion() {
    setModalSalir(false)
    await supabase.auth.signOut()
  }

  const porcentajeUso = Math.min((totalClientes / limiteClientes) * 100, 100)
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const colorUso =
    porcentajeUso > 90 ? colors.error : porcentajeUso > 70 ? colors.advertencia : colors.dorado

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: espaciado.lg }}>
      <ConfirmModal
        visible={modalSalir}
        titulo="Cerrar sesión"
        mensaje="¿Estás seguro que deseas cerrar sesión?"
        textoBoton="Sí, salir"
        colorBoton={colors.error}
        onConfirmar={cerrarSesion}
        onCancelar={() => setModalSalir(false)}
      />

      {/* Info de cuenta */}
      <Card radio={radios.lg} style={styles.seccion}>
        <SeccionTitulo icono="person-outline">Información de cuenta</SeccionTitulo>

        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>Correo electrónico</Text>
          <Text style={styles.emailValor}>{email}</Text>
        </View>

        <CampoTexto
          label="Nombre completo"
          value={nombre}
          onChangeText={(t) => { setNombre(t); setErrorNombre(null) }}
          textoError={errorNombre}
        />

        <CampoTexto
          label="Teléfono"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <Boton
          label="Actualizar información"
          labelCargando="Guardando..."
          icono="save-outline"
          loading={loadingPerfil}
          onPress={actualizarPerfil}
          compacto
        />
      </Card>

      {/* Plan actual */}
      <Card radio={radios.lg} style={styles.seccion}>
        <SeccionTitulo icono="star-outline">Mi plan</SeccionTitulo>

        <View style={[styles.planBadge, { backgroundColor: colorPlan(colors, plan) }]}>
          <View>
            <Text style={styles.planNombre}>Plan {planLabel}</Text>
            <Text style={styles.planDetalle}>Hasta {limiteClientes} clientes</Text>
          </View>
          <Ionicons name="shield-checkmark-outline" size={32} color="rgba(255,255,255,0.5)" />
        </View>

        <View>
          <View style={styles.usoHeader}>
            <Text style={styles.usoLabel}>Clientes registrados</Text>
            <Text style={styles.usoNumero}>{totalClientes} / {limiteClientes}</Text>
          </View>
          <BarraProgreso porcentaje={porcentajeUso} color={colorUso} fondo={colors.superficieAlt} />
          <Text style={styles.usoResto}>
            {limiteClientes - totalClientes} clientes disponibles
          </Text>
        </View>
      </Card>

      {/* Apariencia */}
      <Card radio={radios.lg} style={styles.seccion}>
        <SeccionTitulo icono="contrast-outline">Apariencia</SeccionTitulo>
        <View style={styles.temaOpciones}>
          {PREFERENCIAS.map((p) => {
            const activa = preferencia === p.id
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.temaOpcion, activa && styles.temaOpcionActiva]}
                onPress={() => setPreferencia(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={`Tema ${p.label}`}
              >
                <Ionicons
                  name={p.icono}
                  size={22}
                  color={activa ? colors.dorado : colors.textoSuave}
                />
                <Text style={[styles.temaLabel, activa && styles.temaLabelActiva]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <Text style={styles.temaNota}>
          «Sistema» sigue el ajuste de tu teléfono.
        </Text>
      </Card>

      {/* Cambiar contraseña */}
      <Card radio={radios.lg} style={styles.seccion}>
        <SeccionTitulo icono="lock-closed-outline">Cambiar contraseña</SeccionTitulo>

        <CampoTexto
          label="Nueva contraseña"
          value={passwordNuevo}
          onChangeText={(t) => { setPasswordNuevo(t); setErrorPass({}) }}
          secureTextEntry={!verPassword}
          iconoDerecha={verPassword ? 'eye-off' : 'eye'}
          onPressIconoDerecha={() => setVerPassword(!verPassword)}
          textoError={errorPass.nueva}
        />

        <CampoTexto
          label="Confirmar contraseña"
          value={passwordConfirm}
          onChangeText={(t) => { setPasswordConfirm(t); setErrorPass({}) }}
          secureTextEntry={!verPasswordConfirm}
          iconoDerecha={verPasswordConfirm ? 'eye-off' : 'eye'}
          onPressIconoDerecha={() => setVerPasswordConfirm(!verPasswordConfirm)}
          textoError={errorPass.confirmar}
        />

        <Boton
          label="Cambiar contraseña"
          labelCargando="Actualizando..."
          icono="key-outline"
          loading={loadingPass}
          onPress={cambiarPassword}
          compacto
        />
      </Card>

      {/* Cerrar sesión */}
      <Boton
        label="Cerrar sesión"
        icono="log-out-outline"
        variante="peligro"
        onPress={() => setModalSalir(true)}
        style={styles.botonSalir}
      />
    </ScrollView>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  container: { flex: 1, backgroundColor: colors.fondo },
  seccion: { marginBottom: espaciado.md },
  temaOpciones: { flexDirection: 'row', gap: espaciado.sm + 4 },
  temaOpcion: {
    flex: 1,
    minHeight: TOUCH_MIN + 16,
    paddingVertical: espaciado.sm + 4,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.superficieAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.xs + 2,
  },
  temaOpcionActiva: { backgroundColor: colors.oscuro, borderColor: colors.dorado },
  temaLabel: { ...tipografia.secundario, fontWeight: '600' },
  temaLabelActiva: { color: colors.dorado },
  temaNota: { ...tipografia.micro, marginTop: espaciado.sm + 4 },
  emailContainer: {
    backgroundColor: colors.superficieAlt,
    padding: espaciado.sm + 6,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colors.borde,
    marginBottom: espaciado.sm + 4,
  },
  emailLabel: { ...tipografia.secundario, marginBottom: 2 },
  emailValor: tipografia.cuerpo,
  planBadge: {
    borderRadius: radios.md,
    padding: espaciado.md,
    marginBottom: espaciado.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planNombre: { ...tipografia.tituloModal, color: colors.sobreOscuro },
  planDetalle: { ...tipografia.etiqueta, color: 'rgba(255,255,255,0.8)', marginTop: espaciado.xs },
  usoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: espaciado.sm },
  usoLabel: { ...tipografia.etiqueta, color: colors.textoSuave },
  usoNumero: tipografia.etiquetaFuerte,
  usoResto: { ...tipografia.secundario, marginTop: espaciado.sm - 2, textAlign: 'right' },
  botonSalir: { marginBottom: espaciado.xl + 8 },
}))
