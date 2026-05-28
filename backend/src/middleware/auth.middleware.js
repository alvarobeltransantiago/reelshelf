import { verifyToken } from '../utils/jwt.js'
import { sendError } from '../utils/response.js'

function getBearerToken(req) {
  const authorization = req.headers.authorization

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice(7)
}

export function requireAuth(req, res, next) {
  const token = getBearerToken(req)

  if (!token) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'Debes iniciar sesión')
  }

  try {
    const payload = verifyToken(token, 'access')

    req.user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
    }

    return next()
  } catch (error) {
    return sendError(res, 401, 'INVALID_TOKEN', 'La sesión no es válida')
  }
}

export function optionalAuth(req, res, next) {
  const token = getBearerToken(req)

  if (!token) {
    return next()
  }

  try {
    const payload = verifyToken(token, 'access')

    req.user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
    }
  } catch (error) {
    req.user = null
  }

  return next()
}
