import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { login, logout, refresh, register } from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { loginSchema, refreshSchema, registerSchema } from '../schemas/auth.schemas.js'

const router = Router()

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Has excedido el límite de intentos. Inténtalo más tarde.',
    },
  },
})

router.post('/register', authRateLimiter, validate(registerSchema), register)
router.post('/login', authRateLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.post('/refresh', validate(refreshSchema), refresh)

export default router
