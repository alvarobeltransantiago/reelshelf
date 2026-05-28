import jwt from 'jsonwebtoken'

const ACCESS_EXPIRES_IN = '15m'
const REFRESH_EXPIRES_IN = '7d'

function getAccessSecret() {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is required')
  }

  return process.env.JWT_ACCESS_SECRET
}

function getRefreshSecret() {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required')
  }

  return process.env.JWT_REFRESH_SECRET
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
      type: 'access',
    },
    getAccessSecret(),
    { expiresIn: ACCESS_EXPIRES_IN }
  )
}

export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    getRefreshSecret(),
    { expiresIn: REFRESH_EXPIRES_IN }
  )
}

export function verifyToken(token, type = 'access') {
  const secret = type === 'refresh' ? getRefreshSecret() : getAccessSecret()

  return jwt.verify(token, secret)
}
