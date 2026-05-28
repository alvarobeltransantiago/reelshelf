/**
 * Recorta texto sin forzar lógica de presentación en los componentes.
 * @param {string} value
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(value, maxLength = 160) {
  if (!value || value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trim()}...`
}
