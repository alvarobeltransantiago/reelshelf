export function sanitizeText(value) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/[<>]/g, '').trim()
}

export function sanitizeMultilineText(value) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/[<>]/g, '').trim()
}

export function normalizeTag(tag) {
  return sanitizeText(tag)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
