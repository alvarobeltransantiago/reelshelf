import crypto from 'crypto'

import pool from '../db/pool.js'
import { comparePassword, hashPassword } from '../utils/hash.js'
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { sanitizeText } from '../utils/sanitize.js'

const REFRESH_COOKIE_NAME = 'refreshToken'
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

function buildSafeUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    bio: row.bio,
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader) {
    return {}
  }

  return cookieHeader.split(';').reduce((accumulator, cookiePart) => {
    const [rawKey, ...rawValue] = cookiePart.trim().split('=')
    accumulator[rawKey] = decodeURIComponent(rawValue.join('='))
    return accumulator
  }, {})
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/api/v1/auth',
  })
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/v1/auth',
  })
}

async function persistRefreshToken(client, userId, refreshToken) {
  const payload = verifyToken(refreshToken, 'refresh')
  const tokenHash = hashToken(refreshToken)
  const expiresAt = new Date(payload.exp * 1000)

  await client.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  )
}

export async function register(req, res, next) {
  const client = await pool.connect()
  let transactionStarted = false

  try {
    const { username, email, password } = req.validated.body
    const normalizedUsername = sanitizeText(username)
    const normalizedEmail = sanitizeText(email).toLowerCase()
    const passwordHash = await hashPassword(password)

    await client.query('BEGIN')
    transactionStarted = true

    const existingUser = await client.query(
      `SELECT id
       FROM users
       WHERE username = $1 OR LOWER(email) = $2`,
      [normalizedUsername, normalizedEmail]
    )

    if (existingUser.rows[0]) {
      await client.query('ROLLBACK')
      return sendError(res, 409, 'USER_ALREADY_EXISTS', 'El usuario o email ya están en uso')
    }

    const insertedUser = await client.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, bio, avatar_url, created_at, updated_at`,
      [normalizedUsername, normalizedEmail, passwordHash]
    )

    const user = insertedUser.rows[0]
    const accessToken = signAccessToken(user)
    const refreshToken = signRefreshToken(user)

    await persistRefreshToken(client, user.id, refreshToken)
    await client.query('COMMIT')

    setRefreshCookie(res, refreshToken)

    return sendSuccess(res, 201, {
      user: buildSafeUser(user),
      accessToken,
    })
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK')
    }
    return next(error)
  } finally {
    client.release()
  }
}

export async function login(req, res, next) {
  const client = await pool.connect()
  let transactionStarted = false

  try {
    const { email, password } = req.validated.body
    const normalizedEmail = sanitizeText(email).toLowerCase()

    const userResult = await client.query(
      `SELECT id, username, email, password_hash, bio, avatar_url, created_at, updated_at
       FROM users
       WHERE LOWER(email) = $1`,
      [normalizedEmail]
    )

    const user = userResult.rows[0]

    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos')
    }

    const isPasswordValid = await comparePassword(password, user.password_hash)

    if (!isPasswordValid) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos')
    }

    await client.query('BEGIN')
    transactionStarted = true

    const accessToken = signAccessToken(user)
    const refreshToken = signRefreshToken(user)

    await persistRefreshToken(client, user.id, refreshToken)
    await client.query('COMMIT')

    setRefreshCookie(res, refreshToken)

    return sendSuccess(res, 200, {
      user: buildSafeUser(user),
      accessToken,
    })
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK')
    }
    return next(error)
  } finally {
    client.release()
  }
}

export async function logout(req, res, next) {
  try {
    const cookies = parseCookies(req)
    const refreshToken = cookies[REFRESH_COOKIE_NAME]

    if (refreshToken) {
      await pool.query(
        `DELETE FROM refresh_tokens
         WHERE token_hash = $1`,
        [hashToken(refreshToken)]
      )
    }

    clearRefreshCookie(res)

    return sendSuccess(res, 200, { message: 'Sesión cerrada correctamente' })
  } catch (error) {
    return next(error)
  }
}

export async function refresh(req, res, next) {
  const client = await pool.connect()
  let transactionStarted = false

  try {
    const cookies = parseCookies(req)
    const refreshToken = cookies[REFRESH_COOKIE_NAME]

    if (!refreshToken) {
      return sendError(res, 401, 'REFRESH_REQUIRED', 'No se encontró refresh token')
    }

    const payload = verifyToken(refreshToken, 'refresh')
    const tokenHash = hashToken(refreshToken)

    const tokenResult = await client.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.username, u.email, u.bio, u.avatar_url, u.created_at, u.updated_at
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    )

    const tokenRow = tokenResult.rows[0]

    if (!tokenRow) {
      clearRefreshCookie(res)
      return sendError(res, 401, 'INVALID_REFRESH_TOKEN', 'No se pudo renovar la sesión')
    }

    if (new Date(tokenRow.expires_at) <= new Date()) {
      await client.query('DELETE FROM refresh_tokens WHERE id = $1', [tokenRow.id])
      clearRefreshCookie(res)
      return sendError(res, 401, 'EXPIRED_REFRESH_TOKEN', 'La sesión ha expirado')
    }

    await client.query('BEGIN')
    transactionStarted = true
    await client.query('DELETE FROM refresh_tokens WHERE id = $1', [tokenRow.id])

    const user = {
      id: payload.sub,
      username: tokenRow.username,
      email: tokenRow.email,
      bio: tokenRow.bio,
      avatar_url: tokenRow.avatar_url,
      created_at: tokenRow.created_at,
      updated_at: tokenRow.updated_at,
    }

    const nextAccessToken = signAccessToken(user)
    const nextRefreshToken = signRefreshToken(user)

    await persistRefreshToken(client, user.id, nextRefreshToken)
    await client.query('COMMIT')

    setRefreshCookie(res, nextRefreshToken)

    return sendSuccess(res, 200, {
      user,
      accessToken: nextAccessToken,
    })
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK')
    }
    clearRefreshCookie(res)
    return next(error)
  } finally {
    client.release()
  }
}
