import { z } from 'zod'

const usernameSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[A-Za-z0-9_]+$/, 'El username solo puede incluir letras, números y guion bajo')

const categorySchema = z.enum(['game', 'movie', 'series', 'book'])
const librarySortSchema = z.enum(['newest', 'oldest', 'rating_desc', 'rating_asc', 'title_asc', 'author_asc', 'top_rank'])
const librarySearchFieldSchema = z.enum(['all', 'title', 'author', 'rating'])

const avatarSchema = z
  .string()
  .max(2000000)
  .refine(
    (value) => value === '' || /^https?:\/\//.test(value) || /^data:image\/[a-zA-Z]+;base64,/.test(value),
    'Introduce una URL válida o sube una imagen compatible'
  )

export const usernameParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    username: usernameSchema,
  }),
  query: z.object({}).optional(),
})

export const userReviewsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    username: usernameSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    category: categorySchema.optional(),
  }),
})

export const meLibrarySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    category: categorySchema.optional(),
    q: z.string().max(200).optional(),
    searchField: librarySearchFieldSchema.optional(),
    sort: librarySortSchema.optional(),
    minRating: z.coerce.number().int().min(1).max(10).optional(),
  }),
})

export const updateTopReviewsSchema = z.object({
  body: z.object({
    reviewIds: z.array(z.string().uuid()).max(10),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const updateMeSchema = z.object({
  body: z
    .object({
      username: usernameSchema.optional(),
      bio: z.string().max(280).optional().or(z.literal('')),
      avatar_url: avatarSchema.optional().or(z.literal('')),
    })
    .refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar'),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
