import pool from '../db/pool.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { sanitizeText } from '../utils/sanitize.js'

const LIBRARY_PAGE_SIZE = 9
const REVIEW_FIELDS = `
  r.id,
  r.title,
  r.author,
  r.category,
  r.cover_url,
  r.rating,
  r.aspect_ratings,
  r.top_rank,
  r.is_favorite,
  r.body,
  r.tags,
  r.status,
  r.created_at,
  r.updated_at,
  u.username,
  u.avatar_url
`

const LIBRARY_SORTS = {
  newest: 'r.created_at DESC, r.updated_at DESC',
  oldest: 'r.created_at ASC',
  updated_desc: 'r.updated_at DESC, r.created_at DESC',
  rating_desc: 'r.rating DESC, r.created_at DESC',
  rating_asc: 'r.rating ASC, r.created_at DESC',
  title_asc: 'LOWER(r.title) ASC, r.created_at DESC',
  title_desc: 'LOWER(r.title) DESC, r.created_at DESC',
  author_asc: 'LOWER(r.author) ASC, r.created_at DESC',
  author_desc: 'LOWER(r.author) DESC, r.created_at DESC',
  favorites_first: 'r.is_favorite DESC, r.updated_at DESC, r.created_at DESC',
  top_rank: 'r.top_rank ASC NULLS LAST, r.rating DESC, r.created_at DESC',
}

const WISHLIST_FIELDS = `
  id,
  title,
  author,
  category,
  notes,
  cover_url,
  rank,
  created_at,
  updated_at
`

function buildPublicProfile(row) {
  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    stats: {
      reviewCount: Number(row.review_count || 0),
    },
  }
}

function buildCategoryCounts(row) {
  return {
    game: Number(row.game_count || 0),
    movie: Number(row.movie_count || 0),
    series: Number(row.series_count || 0),
    book: Number(row.book_count || 0),
  }
}

export async function getPublicProfile(req, res, next) {
  try {
    const { username } = req.validated.params

    const profileResult = await pool.query(
      `SELECT u.id, u.username, u.bio, u.avatar_url, u.created_at, u.updated_at,
              COUNT(r.id) FILTER (WHERE r.status = 'published') AS review_count
       FROM users u
       LEFT JOIN reviews r ON r.user_id = u.id
       WHERE u.username = $1
       GROUP BY u.id`,
      [username]
    )

    const profile = profileResult.rows[0]

    if (!profile) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado')
    }

    return sendSuccess(res, 200, buildPublicProfile(profile))
  } catch (error) {
    return next(error)
  }
}

export async function getMyLibrary(req, res, next) {
  try {
    const page = req.validated.query.page || 1
    const limit = req.validated.query.limit || LIBRARY_PAGE_SIZE
    const offset = (page - 1) * limit
    const { category, q } = req.validated.query
    const sort = LIBRARY_SORTS[req.validated.query.sort] ? req.validated.query.sort : 'newest'
    const values = [req.user.id]
    const filters = ['r.user_id = $1']

    if (category) {
      values.push(category)
      filters.push(`r.category = $${values.length}`)
    }

    if (q) {
      const sanitizedQuery = sanitizeText(q)
      values.push(`%${sanitizedQuery}%`)
      filters.push(`(r.title ILIKE $${values.length} OR r.author ILIKE $${values.length} OR r.body ILIKE $${values.length})`)
    }

    const filterClause = `WHERE ${filters.join(' AND ')}`

    const [userResult, countsResult, topReviewsResult, totalResult] = await Promise.all([
      pool.query(
        `SELECT id, username, email, bio, avatar_url, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [req.user.id]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE category = 'game') AS game_count,
           COUNT(*) FILTER (WHERE category = 'movie') AS movie_count,
           COUNT(*) FILTER (WHERE category = 'series') AS series_count,
           COUNT(*) FILTER (WHERE category = 'book') AS book_count
         FROM reviews
         WHERE user_id = $1`,
        [req.user.id]
      ),
      pool.query(
        `SELECT ${REVIEW_FIELDS}
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.user_id = $1
           AND ($2::text IS NULL OR r.category = $2)
           AND r.top_rank IS NOT NULL
         ORDER BY r.top_rank ASC, r.updated_at DESC`,
        [req.user.id, category || null]
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM reviews r
         ${filterClause}`,
        values
      ),
    ])

    const reviewsValues = [...values, limit, offset]
    const reviewsResult = await pool.query(
      `SELECT ${REVIEW_FIELDS}
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       ${filterClause}
       ORDER BY ${LIBRARY_SORTS[sort]}
       LIMIT $${reviewsValues.length - 1} OFFSET $${reviewsValues.length}`,
      reviewsValues
    )

    const user = userResult.rows[0]

    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado')
    }

    const total = Number(totalResult.rows[0].total)

    return sendSuccess(
      res,
      200,
      {
        user,
        counts: buildCategoryCounts(countsResult.rows[0]),
        topReviews: topReviewsResult.rows,
        reviews: reviewsResult.rows,
      },
      {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      }
    )
  } catch (error) {
    return next(error)
  }
}

export async function updateMyTopReviews(req, res, next) {
  const client = await pool.connect()

  try {
    const { category, reviewIds } = req.validated.body

    await client.query('BEGIN')

    if (reviewIds.length) {
      const ownedReviewsResult = await client.query(
        `SELECT id
         FROM reviews
         WHERE user_id = $1 AND category = $2 AND id = ANY($3::uuid[])`,
        [req.user.id, category, reviewIds]
      )

      if (ownedReviewsResult.rows.length !== reviewIds.length) {
        await client.query('ROLLBACK')
        return sendError(res, 403, 'FORBIDDEN', 'Solo puedes ordenar reseñas propias')
      }
    }

    await client.query(
      `UPDATE reviews
       SET top_rank = NULL
       WHERE user_id = $1 AND category = $2`,
      [req.user.id, category]
    )

    for (const [index, reviewId] of reviewIds.entries()) {
      await client.query(
        `UPDATE reviews
         SET top_rank = $1
         WHERE id = $2 AND user_id = $3 AND category = $4`,
        [index + 1, reviewId, req.user.id, category]
      )
    }

    const topReviewsResult = await client.query(
      `SELECT ${REVIEW_FIELDS}
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.user_id = $1 AND r.category = $2 AND r.top_rank IS NOT NULL
       ORDER BY r.top_rank ASC`,
      [req.user.id, category]
    )

    await client.query('COMMIT')

    return sendSuccess(res, 200, topReviewsResult.rows)
  } catch (error) {
    await client.query('ROLLBACK')
    return next(error)
  } finally {
    client.release()
  }
}

export async function updateMe(req, res, next) {
  try {
    const { username, bio, avatar_url: avatarUrl } = req.validated.body
    const updates = []
    const values = []

    if (username !== undefined) {
      values.push(sanitizeText(username))
      updates.push(`username = $${values.length}`)
    }

    if (bio !== undefined) {
      values.push(bio ? sanitizeText(bio) : null)
      updates.push(`bio = $${values.length}`)
    }

    if (avatarUrl !== undefined) {
      values.push(avatarUrl ? avatarUrl.trim() : null)
      updates.push(`avatar_url = $${values.length}`)
    }

    let duplicateCheck = null

    if (username !== undefined) {
      duplicateCheck = await pool.query(
        `SELECT id
         FROM users
         WHERE username = $1 AND id <> $2`,
        [sanitizeText(username), req.user.id]
      )
    }

    if (duplicateCheck?.rows[0]) {
      return sendError(res, 409, 'USERNAME_TAKEN', 'Ese nombre de usuario ya está en uso')
    }

    values.push(req.user.id)

    const updatedUser = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, username, email, bio, avatar_url, created_at, updated_at`,
      values
    )

    if (!updatedUser.rows[0]) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado')
    }

    return sendSuccess(res, 200, updatedUser.rows[0])
  } catch (error) {
    return next(error)
  }
}

export async function deleteMe(req, res, next) {
  try {
    await pool.query(
      `DELETE FROM refresh_tokens
       WHERE user_id = $1`,
      [req.user.id]
    )

    const deletedUser = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id`,
      [req.user.id]
    )

    if (!deletedUser.rows[0]) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado')
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/v1/auth',
    })

    return sendSuccess(res, 200, { message: 'Cuenta eliminada correctamente' })
  } catch (error) {
    return next(error)
  }
}

export async function getUserReviews(req, res, next) {
  try {
    const { username } = req.validated.params
    const page = req.validated.query.page || 1
    const limit = 9
    const offset = (page - 1) * limit
    const { category } = req.validated.query

    const userResult = await pool.query(
      `SELECT id, username, bio, avatar_url, created_at, updated_at
       FROM users
       WHERE username = $1`,
      [username]
    )

    const user = userResult.rows[0]

    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado')
    }

    const canSeeDrafts = req.user?.id === user.id
    const values = [user.id]
    const filters = ['r.user_id = $1']

    if (!canSeeDrafts) {
      filters.push(`r.status = 'published'`)
    }

    if (category) {
      values.push(category)
      filters.push(`r.category = $${values.length}`)
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`
    const reviewsValues = [...values, limit, offset]

    const [reviewsResult, totalResult, topReviewsResult] = await Promise.all([
      pool.query(
        `SELECT ${REVIEW_FIELDS}
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT $${reviewsValues.length - 1} OFFSET $${reviewsValues.length}`,
        reviewsValues
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM reviews r
         ${whereClause}`,
        values
      ),
      pool.query(
        `SELECT ${REVIEW_FIELDS}
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.user_id = $1
           AND r.status = 'published'
           AND r.top_rank IS NOT NULL
         ORDER BY r.top_rank ASC
         LIMIT 10`,
        [user.id]
      ),
    ])

    const total = Number(totalResult.rows[0].total)

    return sendSuccess(
      res,
      200,
      {
        user: buildPublicProfile({ ...user, review_count: total }),
        reviews: reviewsResult.rows,
        topReviews: topReviewsResult.rows,
      },
      {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      }
    )
  } catch (error) {
    return next(error)
  }
}

function normalizeNullableText(value) {
  return value ? sanitizeText(value) : null
}

async function compactWishlistRanks(client, userId, category) {
  const result = await client.query(
    `SELECT id
     FROM wishlist_items
     WHERE user_id = $1 AND category = $2
     ORDER BY rank ASC, created_at ASC`,
    [userId, category]
  )

  await client.query(
    `UPDATE wishlist_items
     SET rank = rank + 10000
     WHERE user_id = $1 AND category = $2`,
    [userId, category]
  )

  for (const [index, row] of result.rows.entries()) {
    await client.query(
      `UPDATE wishlist_items
       SET rank = $1
       WHERE id = $2 AND user_id = $3`,
      [index + 1, row.id, userId]
    )
  }
}

export async function getMyWishlist(req, res, next) {
  try {
    const { category } = req.validated.query
    const values = [req.user.id]
    const filters = ['user_id = $1']

    if (category) {
      values.push(category)
      filters.push(`category = $${values.length}`)
    }

    const result = await pool.query(
      `SELECT ${WISHLIST_FIELDS}
       FROM wishlist_items
       WHERE ${filters.join(' AND ')}
       ORDER BY category ASC, rank ASC, created_at ASC`,
      values
    )

    return sendSuccess(res, 200, result.rows)
  } catch (error) {
    return next(error)
  }
}

export async function createWishlistItem(req, res, next) {
  const client = await pool.connect()

  try {
    const { title, author, category, notes, cover_url: coverUrl } = req.validated.body

    await client.query('BEGIN')

    const rankResult = await client.query(
      `SELECT COALESCE(MAX(rank), 0) + 1 AS next_rank
       FROM wishlist_items
       WHERE user_id = $1 AND category = $2`,
      [req.user.id, category]
    )

    const created = await client.query(
      `INSERT INTO wishlist_items (user_id, title, author, category, notes, cover_url, rank)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${WISHLIST_FIELDS}`,
      [
        req.user.id,
        sanitizeText(title),
        normalizeNullableText(author),
        category,
        normalizeNullableText(notes),
        coverUrl ? coverUrl.trim() : null,
        Number(rankResult.rows[0].next_rank),
      ]
    )

    await client.query('COMMIT')
    return sendSuccess(res, 201, created.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    return next(error)
  } finally {
    client.release()
  }
}

export async function updateWishlistItem(req, res, next) {
  const client = await pool.connect()

  try {
    const { id } = req.validated.params
    const currentResult = await client.query(
      `SELECT id, category
       FROM wishlist_items
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )

    const currentItem = currentResult.rows[0]

    if (!currentItem) {
      return sendError(res, 404, 'WISHLIST_ITEM_NOT_FOUND', 'Elemento no encontrado')
    }

    const updates = []
    const values = []

    Object.entries(req.validated.body).forEach(([key, value]) => {
      const column = key === 'cover_url' ? 'cover_url' : key
      const normalizedValue = ['author', 'notes'].includes(key)
        ? normalizeNullableText(value)
        : key === 'cover_url'
          ? value ? value.trim() : null
          : key === 'title'
            ? sanitizeText(value)
            : value

      values.push(normalizedValue)
      updates.push(`${column} = $${values.length}`)
    })

    values.push(id, req.user.id)

    await client.query('BEGIN')

    const updated = await client.query(
      `UPDATE wishlist_items
       SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING ${WISHLIST_FIELDS}`,
      values
    )

    if (req.validated.body.category && req.validated.body.category !== currentItem.category) {
      await compactWishlistRanks(client, req.user.id, currentItem.category)
      await compactWishlistRanks(client, req.user.id, req.validated.body.category)
    }

    await client.query('COMMIT')
    return sendSuccess(res, 200, updated.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    return next(error)
  } finally {
    client.release()
  }
}

export async function deleteWishlistItem(req, res, next) {
  const client = await pool.connect()

  try {
    const { id } = req.validated.params

    await client.query('BEGIN')

    const deleted = await client.query(
      `DELETE FROM wishlist_items
       WHERE id = $1 AND user_id = $2
       RETURNING id, category`,
      [id, req.user.id]
    )

    if (!deleted.rows[0]) {
      await client.query('ROLLBACK')
      return sendError(res, 404, 'WISHLIST_ITEM_NOT_FOUND', 'Elemento no encontrado')
    }

    await compactWishlistRanks(client, req.user.id, deleted.rows[0].category)
    await client.query('COMMIT')

    return sendSuccess(res, 200, { message: 'Elemento eliminado correctamente' })
  } catch (error) {
    await client.query('ROLLBACK')
    return next(error)
  } finally {
    client.release()
  }
}

export async function reorderWishlist(req, res, next) {
  const client = await pool.connect()

  try {
    const { category, itemIds } = req.validated.body

    await client.query('BEGIN')

    if (itemIds.length) {
      const ownedItems = await client.query(
        `SELECT id
         FROM wishlist_items
         WHERE user_id = $1 AND category = $2 AND id = ANY($3::uuid[])`,
        [req.user.id, category, itemIds]
      )

      if (ownedItems.rows.length !== itemIds.length) {
        await client.query('ROLLBACK')
        return sendError(res, 403, 'FORBIDDEN', 'Solo puedes ordenar tu lista de deseos')
      }
    }

    await client.query(
      `UPDATE wishlist_items
       SET rank = rank + 10000
       WHERE user_id = $1 AND category = $2`,
      [req.user.id, category]
    )

    for (const [index, itemId] of itemIds.entries()) {
      await client.query(
        `UPDATE wishlist_items
         SET rank = $1
         WHERE id = $2 AND user_id = $3 AND category = $4`,
        [index + 1, itemId, req.user.id, category]
      )
    }

    const updated = await client.query(
      `SELECT ${WISHLIST_FIELDS}
       FROM wishlist_items
       WHERE user_id = $1 AND category = $2
       ORDER BY rank ASC, created_at ASC`,
      [req.user.id, category]
    )

    await client.query('COMMIT')
    return sendSuccess(res, 200, updated.rows)
  } catch (error) {
    await client.query('ROLLBACK')
    return next(error)
  } finally {
    client.release()
  }
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  return `'${String(value).replaceAll("'", "''")}'`
}

function sqlJson(value) {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  return `${sqlString(JSON.stringify(value))}::jsonb`
}

function sqlArray(values) {
  if (!values?.length) {
    return 'NULL'
  }

  return `ARRAY[${values.map(sqlString).join(', ')}]::varchar(30)[]`
}

export async function downloadMyBackup(req, res, next) {
  try {
    const [userResult, reviewsResult, wishlistResult] = await Promise.all([
      pool.query(
        `SELECT id, username, email, password_hash, bio, avatar_url, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [req.user.id]
      ),
      pool.query(
        `SELECT id, user_id, title, author, category, cover_url, rating, aspect_ratings, top_rank, is_favorite, body, tags, status, created_at, updated_at
         FROM reviews
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [req.user.id]
      ),
      pool.query(
        `SELECT id, user_id, title, author, category, notes, cover_url, rank, created_at, updated_at
         FROM wishlist_items
         WHERE user_id = $1
         ORDER BY category ASC, rank ASC`,
        [req.user.id]
      ),
    ])

    const user = userResult.rows[0]

    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado')
    }

    const lines = [
      '-- Reelshelf personal backup',
      `-- Usuario: ${user.username}`,
      `-- Generado: ${new Date().toISOString()}`,
      'BEGIN;',
      `INSERT INTO users (id, username, email, password_hash, bio, avatar_url, created_at, updated_at)
VALUES (${sqlString(user.id)}::uuid, ${sqlString(user.username)}, ${sqlString(user.email)}, ${sqlString(user.password_hash)}, ${sqlString(user.bio)}, ${sqlString(user.avatar_url)}, ${sqlString(user.created_at.toISOString())}::timestamptz, ${sqlString(user.updated_at.toISOString())}::timestamptz)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, bio = EXCLUDED.bio, avatar_url = EXCLUDED.avatar_url, updated_at = EXCLUDED.updated_at;`,
    ]

    reviewsResult.rows.forEach((review) => {
      lines.push(
        `INSERT INTO reviews (id, user_id, title, author, category, cover_url, rating, aspect_ratings, top_rank, is_favorite, body, tags, status, created_at, updated_at)
VALUES (${sqlString(review.id)}::uuid, ${sqlString(review.user_id)}::uuid, ${sqlString(review.title)}, ${sqlString(review.author)}, ${sqlString(review.category)}, ${sqlString(review.cover_url)}, ${review.rating}, ${sqlJson(review.aspect_ratings)}, ${review.top_rank ?? 'NULL'}, ${review.is_favorite ? 'TRUE' : 'FALSE'}, ${sqlString(review.body)}, ${sqlArray(review.tags)}, ${sqlString(review.status)}, ${sqlString(review.created_at.toISOString())}::timestamptz, ${sqlString(review.updated_at.toISOString())}::timestamptz)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author, category = EXCLUDED.category, cover_url = EXCLUDED.cover_url, rating = EXCLUDED.rating, aspect_ratings = EXCLUDED.aspect_ratings, top_rank = EXCLUDED.top_rank, is_favorite = EXCLUDED.is_favorite, body = EXCLUDED.body, tags = EXCLUDED.tags, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;`
      )
    })

    wishlistResult.rows.forEach((item) => {
      lines.push(
        `INSERT INTO wishlist_items (id, user_id, title, author, category, notes, cover_url, rank, created_at, updated_at)
VALUES (${sqlString(item.id)}::uuid, ${sqlString(item.user_id)}::uuid, ${sqlString(item.title)}, ${sqlString(item.author)}, ${sqlString(item.category)}, ${sqlString(item.notes)}, ${sqlString(item.cover_url)}, ${item.rank}, ${sqlString(item.created_at.toISOString())}::timestamptz, ${sqlString(item.updated_at.toISOString())}::timestamptz)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author, category = EXCLUDED.category, notes = EXCLUDED.notes, cover_url = EXCLUDED.cover_url, rank = EXCLUDED.rank, updated_at = EXCLUDED.updated_at;`
      )
    })

    lines.push('COMMIT;')

    res.setHeader('Content-Type', 'application/sql; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="reelshelf-backup-${user.username}.sql"`)
    return res.status(200).send(lines.join('\n\n'))
  } catch (error) {
    return next(error)
  }
}
