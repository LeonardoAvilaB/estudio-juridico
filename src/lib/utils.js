export function formatMonto(valor) {
  return parseFloat(valor || 0)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}