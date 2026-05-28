/**
 * Formatea una fecha a un formato legible en español.
 * @param {string | Date} value
 * @returns {string}
 */
export function formatDate(value) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
