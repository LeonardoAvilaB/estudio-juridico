/**
 * Manejo de fechas de pago.
 *
 * `pagos.fecha_pago` es una fecha sin hora ('YYYY-MM-DD'): representa el día
 * calendario en que se cobró, no un instante. Las dos conversiones obvias de
 * JavaScript la rompen, y el error se compensa al revés en cada sentido:
 *
 *   new Date('2026-10-01')         -> medianoche UTC, que en Bolivia (UTC-4) es
 *                                     el 30/09 a las 20:00 hora local
 *   fecha.toISOString().slice(0,10) -> pasa a UTC, así que un pago cargado a las
 *                                     21:00 del 23 se guarda como día 24
 *
 * Por eso acá se arma y se lee siempre con los componentes locales de la fecha.
 */

/** Date -> 'YYYY-MM-DD' con el día que ve el usuario, no el de UTC. */
export function aFechaDB(date) {
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mes}-${dia}`
}

/** 'YYYY-MM-DD' -> Date a medianoche local. */
export function parsearFechaDB(fechaStr) {
  if (!fechaStr) return null
  const [anio, mes, dia] = fechaStr.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' para mostrar. */
export function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return ''
  const [anio, mes, dia] = fechaStr.split('-')
  return `${dia}/${mes}/${anio}`
}

/** Date -> '23 de septiembre de 2026'. */
export function formatearFechaLarga(date) {
  if (!date) return ''
  return date.toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })
}
