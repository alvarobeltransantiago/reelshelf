import { z } from 'zod'

const usernameSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[A-Za-z0-9_]+$/, 'El username solo puede incluir letras, números y guion bajo')

const categorySchema = z.enum(['game', 'movie', 'series', 'book'])
const librarySortSchema = z.enum(['newest', 'oldest', 'rating_desc', 'rating_asc', 'title_asc', 'author_asc', 'top_rank'])

const avatarSchema = z
  .string()
  .max(2000000)
  .refine(
    (value) =>
      value === '' ||
      /^preset:[a-z-]+$/.test(value) ||
      /^https?:\/\//.test(value) ||
      /^data:image\/[a-zA-Z]+;base64,/.test(value) ||
      /^data:image\/svg\+xml(;utf8|;charset=utf-8)?,/.test(value),
    'Elige un icono valido'
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
    limit: z.coerce.number().int().min(1).max(500).optional(),
    category: categorySchema.optional(),
    q: z.string().max(200).optional(),
    sort: librarySortSchema.optional(),
  }),
})

export const updateTopReviewsSchema = z.object({
  body: z.object({
    reviewIds: z.array(z.string().uuid()).max(10),
    category: categorySchema,
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const wishlistItemParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('El identificador de la lista de deseos no es valido'),
  }),
  query: z.object({}).optional(),
})

export const wishlistQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    category: categorySchema.optional(),
  }),
})

export const wishlistPayloadSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    author: z.string().max(160).optional().or(z.literal('')),
    category: categorySchema,
    notes: z.string().max(1000).optional().or(z.literal('')),
    cover_url: avatarSchema.optional().or(z.literal('')),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const updateWishlistItemSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      author: z.string().max(160).optional().or(z.literal('')),
      category: categorySchema.optional(),
      notes: z.string().max(1000).optional().or(z.literal('')),
      cover_url: avatarSchema.optional().or(z.literal('')),
    })
    .refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar'),
  params: z.object({
    id: z.string().uuid('El identificador de la lista de deseos no es valido'),
  }),
  query: z.object({}).optional(),
})

export const reorderWishlistSchema = z.object({
  body: z.object({
    category: categorySchema,
    itemIds: z.array(z.string().uuid()).max(999),
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
