export function sendSuccess(res, statusCode, data, meta) {
  const payload = { data }

  if (meta) {
    payload.meta = meta
  }

  return res.status(statusCode).json(payload)
}

export function sendError(res, statusCode, code, message, details) {
  const payload = {
    error: {
      code,
      message,
    },
  }

  if (details) {
    payload.error.details = details
  }

  return res.status(statusCode).json(payload)
}
