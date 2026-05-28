import { ZodError } from 'zod'

import { sendError } from '../utils/response.js'

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Datos no válidos', err.flatten())
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'La sesión no es válida')
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }

  return sendError(res, err.statusCode || 500, err.code || 'INTERNAL_SERVER_ERROR', err.message || 'Ha ocurrido un error inesperado')
}
