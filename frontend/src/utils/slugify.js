/**
 * Normaliza texto a lowercase-kebab para tags y URLs internas.
 * @param {string} value
 * @returns {string}
 */
export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
