import { z } from 'zod'

const reviewIdParams = z.object({
  id: z.string().uuid('El identificador de la reseña no es válido'),
})

const categorySchema = z.enum(['game', 'movie', 'series', 'book'])

const tagSchema = z
  .string()
  .min(1)
  .max(30)
  .regex(/^[a-z0-9-]+$/, 'Los tags deben estar en lowercase-kebab')

const reviewBodySchema = z.string().min(50).max(5000)
const aspectRatingsSchema = z
  .record(z.string().min(1).max(40).regex(/^[a-z0-9-]+$/), z.number().int().min(1).max(10))
  .refine((value) => {
    const keys = Object.keys(value)
    return keys.length >= 3 && keys.length <= 6
  }, 'Debes puntuar entre 3 y 6 aspectos')

export const listReviewsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    category: categorySchema.optional(),
    tag: tagSchema.optional(),
    sort: z.enum(['newest', 'top-rated']).optional(),
    q: z.string().max(200).optional(),
    page: z.coerce.number().int().min(1).optional(),
  }),
})

export const createReviewSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    author: z.string().min(1).max(160),
    category: categorySchema,
    cover_url: z.string().url().max(500).optional().or(z.literal('')),
    rating: z.number().int().min(1).max(10),
    aspect_ratings: aspectRatingsSchema,
    body: reviewBodySchema,
    tags: z.array(tagSchema).max(5).optional(),
    status: z.enum(['published', 'draft']),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const reviewParamsSchema = z.object({
  body: z.object({}).optional(),
  params: reviewIdParams,
  query: z.object({}).optional(),
})

export const updateReviewSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      author: z.string().min(1).max(160).optional(),
      category: categorySchema.optional(),
      cover_url: z.string().url().max(500).optional().or(z.literal('')),
      rating: z.number().int().min(1).max(10).optional(),
      aspect_ratings: aspectRatingsSchema.optional(),
      body: reviewBodySchema.optional(),
      tags: z.array(tagSchema).max(5).optional(),
      status: z.enum(['published', 'draft']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar'),
  params: reviewIdParams,
  query: z.object({}).optional(),
})
