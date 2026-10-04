import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Platform, RefreshControl,
} from 'react-native'
import { supabase } from '../lib/supabase'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import {
  Boton, BotonTag, Card, ConfirmModal, EstadoVacio, ModalBase, SeccionTitulo, Skeleton,
} from '../components'
import { useToast } from '../components/ToastProvider'
import { formatMonto } from '../lib/utils'
import { crearEstilos, radios, espaciado, TOUCH_MIN } from '../lib/theme'
import { useTema } from '../lib/TemaContext'
import { formatearFechaCorta } from '../lib/fechas'
import { llamar, numeroParaLlamar } from '../lib/contacto'
import { Ionicons } from '@expo/vector-icons'

const TIPOS_PAGO = [
  { valor: 'Efectivo', icono: 'cash-outline' },
  { valor: 'QR', icono: 'qr-code-outline' },
]

export default function DetalleClienteScreen({ route, navigation }) {
  const { colors, tipografia, sombras } = useTema()
  const styles = usarEstilos(colors, tipografia, sombras)
  const { cliente } = route.params
  const mostrarToast = useToast()
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [modal, setModal] = useState({ visible: false, tipo: null, id: null })
  const [modalPDF, setModalPDF] = useState(false)
  const [modalTipoPago, setModalTipoPago] = useState({ visible: false, pagoId: null, tipoActual: null })

  useEffect(() => {
    fetchPagos()
    const unsubscribe = navigation.addListener('focus', () => fetchPagos())
    return unsubscribe
  }, [navigation])

  async function fetchPagos({ esRefresco = false } = {}) {
    if (esRefresco) setRefrescando(true)
    else setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('pagos')
      .select('*, clientes!inner(abogado_id)')
      .eq('cliente_id', cliente.id)
      .eq('clientes.abogado_id', user.id)
      .order('fecha_pago', { ascending: false })
    if (error || !data) mostrarToast('No se pudieron cargar los pagos')
    else setPagos(data)
    setLoading(false)
    setRefrescando(false)
  }

  function confirmarEliminarPago(id) {
    setModal({ visible: true, tipo: 'pago', id })
  }

  function confirmarEliminarCliente() {
    setModal({ visible: true, tipo: 'cliente', id: cliente.id })
  }

  async function ejecutarEliminar() {
    setModal({ ...modal, visible: false })
    if (modal.tipo === 'pago') {
      const { error } = await supabase.from('pagos').delete().eq('id', modal.id)
      if (error) mostrarToast('No se pudo eliminar el pago')
      else fetchPagos()
    } else if (modal.tipo === 'cliente') {
      const { error } = await supabase.from('clientes').delete().eq('id', modal.id)
      if (error) mostrarToast('No se pudo eliminar el cliente')
      else navigation.goBack()
    }
  }

  async function cambiarTipoPago(nuevoTipo) {
    const { error } = await supabase
      .from('pagos')
      .update({ tipo_pago: nuevoTipo })
      .eq('id', modalTipoPago.pagoId)
    if (error) {
      mostrarToast('No se pudo cambiar el tipo de pago')
    } else {
      setModalTipoPago({ visible: false, pagoId: null, tipoActual: nuevoTipo })
      fetchPagos()
    }
  }

  async function exportarPDF(incluirNotas = true) {
    const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0)
    const pendiente = parseFloat(cliente.monto_total) - totalPagado

    const { data: { user } } = await supabase.auth.getUser()
    const { data: perfil } = await supabase
      .from('profiles')
      .select('nombre, email, telefono')
      .eq('id', user.id)
      .single()

    const { data: notasCliente } = await supabase
      .from('notas')
      .select('*, clientes!inner(abogado_id)')
      .eq('cliente_id', cliente.id)
      .eq('clientes.abogado_id', user.id)
      .order('created_at', { ascending: false })

    const fechaHoy = new Date().toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric'
    })

    const html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
            .pagina { min-height: 100vh; display: flex; flex-direction: column; }
            .contenido { flex: 1; padding: 32px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; border: 1px solid #eee; font-size: 12px; }
            thead tr { background: #1A1A1A; color: #C9A84C; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div style="background:#1A1A1A;padding:32px;text-align:center">
            <h1 style="color:#C9A84C;margin:0;font-size:24px;letter-spacing:2px">AVILA GUTIERREZ</h1>
            <p style="color:#E8C97A;margin:4px 0 0 0;letter-spacing:3px;font-size:13px">& ASOCIADOS</p>
          </div>
          <div style="background:#f0f0f0;padding:16px 32px;border-bottom:3px solid #C9A84C">
            <h2 style="margin:0;color:#1A1A1A;font-size:16px">REPORTE DE PAGOS</h2>
            <p style="margin:4px 0 0 0;color:#888;font-size:12px">Fecha de emisión: ${fechaHoy}</p>
          </div>
          <div style="padding:32px">
            <table style="margin-bottom:32px">
              <tr>
                <td style="width:50%;vertical-align:top;padding-right:16px;border:none">
                  <div style="background:#f9f9f9;border:1px solid #eee;border-left:4px solid #C9A84C;padding:16px;border-radius:4px">
                    <h3 style="margin:0 0 12px 0;color:#1A1A1A;font-size:13px;text-transform:uppercase">Abogado Responsable</h3>
                    <p style="margin:6px 0;font-size:13px"><strong>${perfil?.nombre || 'N/A'}</strong></p>
                    <p style="margin:6px 0;font-size:12px;color:#666">${perfil?.email || 'N/A'}</p>
                    <p style="margin:6px 0;font-size:12px;color:#666">${perfil?.telefono || 'N/A'}</p>
                  </div>
                </td>
                <td style="width:50%;vertical-align:top;padding-left:16px;border:none">
                  <div style="background:#f9f9f9;border:1px solid #eee;border-left:4px solid #C9A84C;padding:16px;border-radius:4px">
                    <h3 style="margin:0 0 12px 0;color:#1A1A1A;font-size:13px;text-transform:uppercase">Datos del Cliente</h3>
                    <p style="margin:6px 0;font-size:13px"><strong>${cliente.nombre}</strong></p>
                    <p style="margin:6px 0;font-size:12px;color:#666">${cliente.telefono || 'No registrado'}</p>
                    <p style="margin:6px 0;font-size:12px;color:#666">${cliente.descripcion_caso || 'Sin descripción'}</p>
                    <p style="margin:6px 0;font-size:12px">Estado: <span style="background:#1A1A1A;color:#C9A84C;padding:2px 8px;border-radius:12px;font-size:11px">${cliente.estado || 'Activo'}</span></p>
                  </div>
                </td>
              </tr>
            </table>

            <h3 style="color:#1A1A1A;margin:0 0 12px 0;font-size:14px;text-transform:uppercase;border-bottom:2px solid #C9A84C;padding-bottom:6px">Resumen Financiero</h3>
            <table style="margin-bottom:32px">
              <tr>
                <td style="background:#1A1A1A;color:#C9A84C;padding:16px;text-align:center;border-radius:8px 0 0 8px;border:none">
                  <div style="font-size:11px;opacity:0.8;margin-bottom:4px">TOTAL ACORDADO</div>
                  <div style="font-size:20px;font-weight:bold">Bs. ${parseFloat(cliente.monto_total).toLocaleString('es-BO')}</div>
                </td>
                <td style="background:#C9A84C;color:#1A1A1A;padding:16px;text-align:center;border:none">
                  <div style="font-size:11px;opacity:0.8;margin-bottom:4px">TOTAL PAGADO</div>
                  <div style="font-size:20px;font-weight:bold">Bs. ${totalPagado.toLocaleString('es-BO')}</div>
                </td>
                <td style="background:${pendiente > 0 ? '#e74c3c' : '#27ae60'};color:#fff;padding:16px;text-align:center;border-radius:0 8px 8px 0;border:none">
                  <div style="font-size:11px;opacity:0.8;margin-bottom:4px">SALDO PENDIENTE</div>
                  <div style="font-size:20px;font-weight:bold">Bs. ${pendiente.toLocaleString('es-BO')}</div>
                </td>
              </tr>
            </table>

            <h3 style="color:#1A1A1A;margin:0 0 12px 0;font-size:14px;text-transform:uppercase;border-bottom:2px solid #C9A84C;padding-bottom:6px">Historial de Pagos</h3>
            ${pagos.length === 0 ? '<p style="color:#aaa;text-align:center;padding:24px">No hay pagos registrados</p>' : `
            <table style="margin-bottom:24px">
              <thead>
                <tr>
                  <th style="text-align:left">#</th>
                  <th style="text-align:left">Fecha</th>
                  <th style="text-align:left">Tipo</th>
                  <th style="text-align:right">Monto</th>
                  <th style="text-align:left">Notas</th>
                </tr>
              </thead>
              <tbody>
                ${pagos.map((p, i) => `
                  <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
                    <td>${i + 1}</td>
                    <td>${formatearFechaCorta(p.fecha_pago)}</td>
                    <td>${p.tipo_pago || 'Efectivo'}</td>
                    <td style="text-align:right;color:#C9A84C;font-weight:bold">Bs. ${parseFloat(p.monto).toLocaleString('es-BO')}</td>
                    <td style="color:#666">${p.notas || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background:#1A1A1A">
                  <td colspan="3" style="color:#C9A84C;font-weight:bold">TOTAL</td>
                  <td style="color:#C9A84C;font-weight:bold;text-align:right">Bs. ${totalPagado.toLocaleString('es-BO')}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>`}

            ${incluirNotas ? `
            <h3 style="color:#1A1A1A;margin:24px 0 12px 0;font-size:14px;text-transform:uppercase;border-bottom:2px solid #C9A84C;padding-bottom:6px">Notas del Caso</h3>
            ${!notasCliente || notasCliente.length === 0
              ? '<p style="color:#aaa;text-align:center;padding:16px">No hay notas registradas</p>'
              : notasCliente.map((n, i) => `
                <div style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'};border-left:4px solid #C9A84C;padding:12px 16px;margin-bottom:8px">
                  <p style="margin:0 0 4px 0;font-size:11px;color:#888">
                    ${new Date(n.created_at).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p style="margin:0;font-size:13px;color:#333;line-height:1.6">${n.contenido}</p>
                </div>
              `).join('')}
            ` : ''}
          </div>

          <div style="padding:16px 32px;text-align:center;border-top:2px solid #C9A84C;font-size:11px;color:#aaa;background:#1A1A1A">
            <p style="margin:0;color:#C9A84C;">© ${new Date().getFullYear()} Avila Gutierrez & Asociados — Documento generado el ${fechaHoy}</p>
          </div>
        </body>
      </html>
    `

    try {
      if (Platform.OS === 'web') {
        const { default: html2canvas } = await import('html2canvas')
        const { default: jsPDF } = await import('jspdf')
        const contenedor = document.createElement('div')
        contenedor.innerHTML = html
        contenedor.style.position = 'absolute'
        contenedor.style.left = '-9999px'
        contenedor.style.width = '800px'
        document.body.appendChild(contenedor)
        const canvas = await html2canvas(contenedor, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
        document.body.removeChild(contenedor)
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`reporte-${cliente.nombre.replace(/ /g, '-')}.pdf`)
      } else {
        const { uri } = await Print.printToFileAsync({ html })
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' })
      }
    } catch {
      mostrarToast('No se pudo generar el PDF')
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerAcciones}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('EditarCliente', { cliente })}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${cliente.nombre}`}
          >
            <Text style={styles.headerBtnTexto}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={confirmarEliminarCliente}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${cliente.nombre}`}
          >
            <Text style={[styles.headerBtnTexto, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ),
    })
  }, [navigation, cliente])

  const puedeLlamar = !!numeroParaLlamar(cliente.telefono)
  const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0)
  const pendiente = parseFloat(cliente.monto_total) - totalPagado

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => fetchPagos({ esRefresco: true })}
          colors={[colors.doradoTexto]}
          tintColor={colors.doradoTexto}
        />
      }
    >
      <ConfirmModal
        visible={modal.visible}
        titulo={modal.tipo === 'pago' ? 'Eliminar pago' : 'Eliminar cliente'}
        mensaje={
          modal.tipo === 'pago'
            ? '¿Estás seguro que deseas eliminar este pago?'
            : `¿Estás seguro que deseas eliminar a ${cliente.nombre} y todos sus pagos?`
        }
        textoBoton="Sí, eliminar"
        onConfirmar={ejecutarEliminar}
        onCancelar={() => setModal({ ...modal, visible: false })}
      />
      <ConfirmModal
        visible={modalPDF}
        titulo="Exportar PDF"
        mensaje="¿Deseas incluir las notas del caso en el reporte?"
        textoBoton="Sí"
        textoCancelar="No"
        colorBoton={colors.oscuro}
        onConfirmar={() => { setModalPDF(false); exportarPDF(true) }}
        onCancelar={() => { setModalPDF(false); exportarPDF(false) }}
      />

      {/* Modal tipo de pago */}
      <ModalBase
        visible={modalTipoPago.visible}
        onCerrar={() => setModalTipoPago({ visible: false, pagoId: null, tipoActual: null })}
      >
        <Text style={styles.modalTitulo}>Cambiar tipo de pago</Text>
        <View style={styles.tipoFila}>
          {TIPOS_PAGO.map(({ valor, icono }) => (
            <Boton
              key={valor}
              label={valor}
              icono={icono}
              variante={modalTipoPago.tipoActual === valor ? 'primario' : 'neutro'}
              onPress={() => cambiarTipoPago(valor)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
        <Boton
          label="Cancelar"
          variante="neutro"
          compacto
          style={{ backgroundColor: 'transparent' }}
          onPress={() => setModalTipoPago({ visible: false, pagoId: null, tipoActual: null })}
        />
      </ModalBase>

      {/* Info del cliente */}
      <Card nivel={3} radio={radios.lg} style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.nombre}>{cliente.nombre}</Text>
          {cliente.telefono ? (
            <View style={styles.filaTelefono}>
              <View style={styles.infoFila}>
                <Ionicons name="call-outline" size={14} color={colors.doradoTexto} />
                <Text style={styles.detalle}>{cliente.telefono}</Text>
              </View>
              {puedeLlamar ? (
                <TouchableOpacity
                  style={styles.btnLlamar}
                  onPress={() => llamar(cliente.telefono, mostrarToast)}
                  // El botón es chico a propósito: el hitSlop le devuelve el área
                  // táctil sin agrandarlo visualmente.
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Llamar a ${cliente.nombre}`}
                >
                  <Ionicons name="call" size={12} color={colors.sobreDorado} />
                  <Text style={styles.btnLlamarTexto}>Llamar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {cliente.descripcion_caso ? (
            <View style={styles.infoFila}>
              <Ionicons name="document-text-outline" size={14} color={colors.doradoTexto} />
              <Text style={styles.detalle}>{cliente.descripcion_caso}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.separador} />
        <View style={styles.filaMontos}>
          <View style={styles.montoBox}>
            <Text style={styles.montoLabel}>Total cobrado</Text>
            <Text style={styles.montoValor}>Bs. {formatMonto(cliente.monto_total)}</Text>
          </View>
          <View style={styles.montoDivider} />
          <View style={styles.montoBox}>
            <Text style={styles.montoLabel}>Total pagado</Text>
            <Text style={[styles.montoValor, { color: colors.doradoTexto }]}>Bs. {formatMonto(totalPagado)}</Text>
          </View>
          <View style={styles.montoDivider} />
          <View style={styles.montoBox}>
            <Text style={styles.montoLabel}>Pendiente</Text>
            <Text style={[styles.montoValor, { color: pendiente > 0 ? colors.error : colors.exito }]}>
              {pendiente > 0 ? `Bs. ${formatMonto(pendiente)}` : '✓ Pagado'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Historial de pagos */}
      <View style={styles.seccion}>
        <SeccionTitulo>Historial de pagos</SeccionTitulo>
        {loading ? (
          [0, 1, 2].map((i) => (
            <Card key={i} nivel={1} acento={colors.borde} style={styles.pagoCard} padding={espaciado.sm + 6}>
              <View style={{ flex: 1, gap: espaciado.sm - 2 }}>
                <Skeleton ancho="45%" alto={16} />
                <Skeleton ancho="35%" alto={11} />
                <Skeleton ancho="28%" alto={11} />
              </View>
            </Card>
          ))
        ) : pagos.length === 0 ? (
          <EstadoVacio icono="receipt-outline" mensaje="No hay pagos registrados" />
        ) : (
          pagos.map((pago) => (
            <Card key={pago.id} nivel={1} style={styles.pagoCard} padding={espaciado.sm + 6}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pagoMonto}>Bs. {formatMonto(pago.monto)}</Text>
                <Text style={styles.pagoFecha}>{formatearFechaCorta(pago.fecha_pago)}</Text>
                <TouchableOpacity
                  onPress={() => setModalTipoPago({
                    visible: true,
                    pagoId: pago.id,
                    tipoActual: pago.tipo_pago || 'Efectivo'
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={`Cambiar tipo de pago, actualmente ${pago.tipo_pago || 'Efectivo'}`}
                >
                  <View style={styles.tipoTag}>
                    <Ionicons
                      name={pago.tipo_pago === 'QR' ? 'qr-code-outline' : 'cash-outline'}
                      size={12}
                      color={colors.doradoTexto}
                    />
                    <Text style={styles.tipoTagText}>{pago.tipo_pago || 'Efectivo'}</Text>
                  </View>
                </TouchableOpacity>
                {pago.notas ? <Text style={styles.pagoNota}>{pago.notas}</Text> : null}
              </View>
              <View style={styles.botonesCard}>
                <BotonTag
                  label="Editar"
                  color={colors.info}
                  onPress={() => navigation.navigate('EditarPago', { pago })}
                />
                <BotonTag label="Eliminar" onPress={() => confirmarEliminarPago(pago.id)} />
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Botones */}
      <Boton
        label="Registrar Pago"
        icono="add-circle-outline"
        onPress={() => navigation.navigate('NuevoPago', {
          clienteId: cliente.id,
          saldoPendiente: pendiente,
        })}
        style={styles.button}
      />

      <Boton
        label="Notas del Caso"
        icono="document-text-outline"
        colorTexto={colors.sobreOscuro}
        onPress={() => navigation.navigate('NotasCliente', { cliente })}
        style={[styles.button, { borderColor: colors.textoSuave }]}
      />

      <Boton
        label="Exportar PDF"
        icono="document-outline"
        variante="secundario"
        onPress={() => setModalPDF(true)}
        style={[styles.button, { marginBottom: espaciado.xl + 8 }]}
      />
    </ScrollView>
  )
}

const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({
  container: { flex: 1, backgroundColor: colors.fondo },
  headerAcciones: { flexDirection: 'row', marginRight: espaciado.sm },
  headerBtn: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: espaciado.sm + 2,
    justifyContent: 'center',
  },
  headerBtnTexto: { ...tipografia.etiquetaFuerte, fontSize: 14, color: colors.dorado },
  infoCard: { margin: espaciado.md },
  infoHeader: { marginBottom: espaciado.sm + 4 },
  nombre: { ...tipografia.titulo, marginBottom: espaciado.sm },
  infoFila: { flexDirection: 'row', alignItems: 'center', gap: espaciado.sm - 2, marginBottom: espaciado.xs },
  filaTelefono: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaciado.sm,
  },
  btnLlamar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.xs,
    paddingHorizontal: espaciado.sm,
    paddingVertical: espaciado.xs,
    borderRadius: radios.pill,
    backgroundColor: colors.dorado,
  },
  btnLlamarTexto: { ...tipografia.micro, color: colors.sobreDorado, fontWeight: '700' },
  detalle: tipografia.detalle,
  separador: { height: 1, backgroundColor: colors.borde, marginVertical: espaciado.sm + 4 },
  filaMontos: { flexDirection: 'row', justifyContent: 'space-between' },
  montoBox: { alignItems: 'center', flex: 1 },
  montoDivider: { width: 1, backgroundColor: colors.borde },
  montoLabel: { ...tipografia.micro, marginBottom: espaciado.xs, textAlign: 'center' },
  montoValor: { ...tipografia.montoPequeno, textAlign: 'center' },
  seccion: { marginHorizontal: espaciado.md, marginBottom: espaciado.md },
  pagoCard: {
    marginBottom: espaciado.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagoMonto: tipografia.monto,
  pagoFecha: { ...tipografia.secundario, marginTop: 2 },
  tipoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.xs,
    marginTop: espaciado.xs,
  },
  tipoTagText: { ...tipografia.secundario, color: colors.doradoTexto, fontWeight: '600' },
  pagoNota: { ...tipografia.secundario, marginTop: 2 },
  botonesCard: { alignItems: 'flex-end', gap: espaciado.sm - 2, paddingLeft: espaciado.sm },
  button: {
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.sm,
  },
  modalTitulo: { ...tipografia.tituloModal, marginBottom: espaciado.md },
  tipoFila: { flexDirection: 'row', gap: espaciado.sm + 4, marginBottom: espaciado.md },
}))