import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { errorHandler } from './middleware/error.middleware.js'
import authRoutes from './routes/auth.routes.js'
import reviewsRoutes from './routes/reviews.routes.js'
import usersRoutes from './routes/users.routes.js'
import { sendSuccess } from './utils/response.js'

const app = express()
const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultAllowedOrigins

app.use(
  cors({
    // Permitimos varios orígenes en desarrollo para evitar bloqueos
    // entre localhost y 127.0.0.1 al arrancar Vite manualmente.
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('CORS_ORIGIN_NOT_ALLOWED'))
    },
    credentials: true,
  })
)
app.use(helmet())
app.use(express.json({ limit: '1mb' }))

app.get('/health', (req, res) => {
  return sendSuccess(res, 200, { status: 'ok' })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/reviews', reviewsRoutes)
app.use('/api/v1/users', usersRoutes)

app.use((req, res) => {
  return res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Recurso no encontrado',
    },
  })
})

app.use(errorHandler)

export default app
