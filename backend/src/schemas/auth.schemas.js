import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'La contraseña debe incluir letras y números')

const usernameSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[A-Za-z0-9_]+$/, 'El username solo puede incluir letras, números y guion bajo')

export const registerSchema = z.object({
  body: z.object({
    username: usernameSchema,
    email: z.string().email(),
    password: passwordSchema,
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const refreshSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
