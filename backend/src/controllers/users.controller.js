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
  rating_desc: 'r.rating DESC, r.created_at DESC',
  rating_asc: 'r.rating ASC, r.created_at DESC',
  title_asc: 'LOWER(r.title) ASC, r.created_at DESC',
  author_asc: 'LOWER(r.author) ASC, r.created_at DESC',
  top_rank: 'r.top_rank ASC NULLS LAST, r.rating DESC, r.created_at DESC',
}

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
    const offset = (page - 1) * LIBRARY_PAGE_SIZE
    const { category, q, searchField = 'all', sort = 'newest', minRating } = req.validated.query
    const values = [req.user.id]
    const filters = ['r.user_id = $1']

    if (category) {
      values.push(category)
      filters.push(`r.category = $${values.length}`)
    }

    if (q) {
      const sanitizedQuery = sanitizeText(q)
      const searchFilters = []

      if (searchField === 'all' || searchField === 'title') {
        values.push(`%${sanitizedQuery}%`)
        searchFilters.push(`r.title ILIKE $${values.length}`)
      }

      if (searchField === 'all' || searchField === 'author') {
        values.push(`%${sanitizedQuery}%`)
        searchFilters.push(`r.author ILIKE $${values.length}`)
      }

      if (searchField === 'all' || searchField === 'rating') {
        const numericRating = Number(sanitizedQuery.replace(',', '.'))

        if (Number.isInteger(numericRating) && numericRating >= 1 && numericRating <= 10) {
          values.push(numericRating)
          searchFilters.push(`r.rating = $${values.length}`)
        }
      }

      if (searchFilters.length) {
        filters.push(`(${searchFilters.join(' OR ')})`)
      } else {
        filters.push('1 = 0')
      }
    }

    if (minRating) {
      values.push(minRating)
      filters.push(`r.rating >= $${values.length}`)
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
         WHERE r.user_id = $1 AND r.top_rank IS NOT NULL
         ORDER BY r.top_rank ASC, r.updated_at DESC`,
        [req.user.id]
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM reviews r
         ${filterClause}`,
        values
      ),
    ])

    const reviewsValues = [...values, LIBRARY_PAGE_SIZE, offset]
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
        limit: LIBRARY_PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE)),
      }
    )
  } catch (error) {
    return next(error)
  }
}

export async function updateMyTopReviews(req, res, next) {
  const client = await pool.connect()

  try {
    const reviewIds = req.validated.body.reviewIds

    await client.query('BEGIN')

    if (reviewIds.length) {
      const ownedReviewsResult = await client.query(
        `SELECT id
         FROM reviews
         WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [req.user.id, reviewIds]
      )

      if (ownedReviewsResult.rows.length !== reviewIds.length) {
        await client.query('ROLLBACK')
        return sendError(res, 403, 'FORBIDDEN', 'Solo puedes ordenar reseñas propias')
      }
    }

    await client.query(
      `UPDATE reviews
       SET top_rank = NULL
       WHERE user_id = $1`,
      [req.user.id]
    )

    for (const [index, reviewId] of reviewIds.entries()) {
      await client.query(
        `UPDATE reviews
         SET top_rank = $1
         WHERE id = $2 AND user_id = $3`,
        [index + 1, reviewId, req.user.id]
      )
    }

    const topReviewsResult = await client.query(
      `SELECT ${REVIEW_FIELDS}
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.user_id = $1 AND r.top_rank IS NOT NULL
       ORDER BY r.top_rank ASC`,
      [req.user.id]
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
