import pool from '../db/pool.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { normalizeTag, sanitizeMultilineText, sanitizeText } from '../utils/sanitize.js'

const REVIEWS_PER_PAGE = 12
const REVIEW_SELECT = `
  r.id,
  r.user_id,
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

function normalizeAspectRatings(aspectRatings) {
  return Object.entries(aspectRatings).reduce((accumulator, [key, value]) => {
    accumulator[normalizeTag(key)] = value
    return accumulator
  }, {})
}

function normalizeReviewPayload(payload) {
  return {
    title: sanitizeText(payload.title),
    author: sanitizeText(payload.author),
    category: payload.category,
    cover_url: payload.cover_url ? sanitizeText(payload.cover_url) : null,
    rating: payload.rating,
    aspect_ratings: normalizeAspectRatings(payload.aspect_ratings),
    body: sanitizeMultilineText(payload.body),
    tags: payload.tags?.map(normalizeTag) || [],
    status: payload.status,
  }
}

function appendFilter(filters, values, clause, value) {
  values.push(value)
  filters.push(clause.replace('?', `$${values.length}`))
}

export async function getReviews(req, res, next) {
  try {
    const { category, tag, sort = 'newest', q } = req.validated.query
    const page = req.validated.query.page || 1
    const offset = (page - 1) * REVIEWS_PER_PAGE
    const where = [`r.status = 'published'`]
    const values = []

    if (category) {
      appendFilter(where, values, 'r.category = ?', category)
    }

    if (tag) {
      appendFilter(where, values, '? = ANY(r.tags)', normalizeTag(tag))
    }

    if (q) {
      appendFilter(where, values, 'r.title ILIKE ?', `%${sanitizeText(q)}%`)
    }

    const orderBy = sort === 'top-rated' ? 'r.rating DESC, r.created_at DESC' : 'r.created_at DESC'
    const baseWhere = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM reviews r
       ${baseWhere}`,
      values
    )

    values.push(REVIEWS_PER_PAGE, offset)

    const reviewsResult = await pool.query(
      `SELECT ${REVIEW_SELECT}
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       ${baseWhere}
       ORDER BY ${orderBy}
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    )

    const total = Number(totalResult.rows[0].total)

    return sendSuccess(res, 200, reviewsResult.rows, {
      page,
      limit: REVIEWS_PER_PAGE,
      total,
      totalPages: Math.max(1, Math.ceil(total / REVIEWS_PER_PAGE)),
    })
  } catch (error) {
    return next(error)
  }
}

export async function createReview(req, res, next) {
  try {
    const review = normalizeReviewPayload(req.validated.body)

    const createdReview = await pool.query(
      `INSERT INTO reviews (user_id, title, author, category, cover_url, rating, aspect_ratings, body, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id, title, author, category, cover_url, rating, aspect_ratings, top_rank, is_favorite, body, tags, status, created_at, updated_at`,
      [
        req.user.id,
        review.title,
        review.author,
        review.category,
        review.cover_url,
        review.rating,
        review.aspect_ratings,
        review.body,
        review.tags,
        review.status,
      ]
    )

    return sendSuccess(res, 201, createdReview.rows[0])
  } catch (error) {
    return next(error)
  }
}

export async function getReviewById(req, res, next) {
  try {
    const { id } = req.validated.params

    const reviewResult = await pool.query(
      `SELECT ${REVIEW_SELECT}, u.bio
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = $1`,
      [id]
    )

    const review = reviewResult.rows[0]

    if (!review) {
      return sendError(res, 404, 'REVIEW_NOT_FOUND', 'Resena no encontrada')
    }

    const isOwner = req.user?.id === review.user_id

    if (review.status === 'draft' && !isOwner) {
      return sendError(res, 404, 'REVIEW_NOT_FOUND', 'Resena no encontrada')
    }

    return sendSuccess(res, 200, review)
  } catch (error) {
    return next(error)
  }
}

export async function updateReview(req, res, next) {
  try {
    const { id } = req.validated.params
    const existingReview = await pool.query(
      `SELECT id, user_id
       FROM reviews
       WHERE id = $1`,
      [id]
    )

    if (!existingReview.rows[0]) {
      return sendError(res, 404, 'REVIEW_NOT_FOUND', 'Resena no encontrada')
    }

    if (existingReview.rows[0].user_id !== req.user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'No tienes permiso')
    }

    const normalizedBody = {}

    if (req.validated.body.title !== undefined) normalizedBody.title = sanitizeText(req.validated.body.title)
    if (req.validated.body.author !== undefined) normalizedBody.author = sanitizeText(req.validated.body.author)
    if (req.validated.body.category !== undefined) normalizedBody.category = req.validated.body.category
    if (req.validated.body.cover_url !== undefined) normalizedBody.cover_url = req.validated.body.cover_url ? sanitizeText(req.validated.body.cover_url) : null
    if (req.validated.body.rating !== undefined) normalizedBody.rating = req.validated.body.rating
    if (req.validated.body.aspect_ratings !== undefined) normalizedBody.aspect_ratings = normalizeAspectRatings(req.validated.body.aspect_ratings)
    if (req.validated.body.is_favorite !== undefined) normalizedBody.is_favorite = req.validated.body.is_favorite
    if (req.validated.body.body !== undefined) normalizedBody.body = sanitizeMultilineText(req.validated.body.body)
    if (req.validated.body.tags !== undefined) normalizedBody.tags = req.validated.body.tags.map(normalizeTag)
    if (req.validated.body.status !== undefined) normalizedBody.status = req.validated.body.status

    const values = []
    const updates = []

    Object.entries(normalizedBody).forEach(([key, value]) => {
      values.push(value)
      updates.push(`${key} = $${values.length}`)
    })

    values.push(id)

    const updatedReview = await pool.query(
      `UPDATE reviews
       SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, user_id, title, author, category, cover_url, rating, aspect_ratings, top_rank, is_favorite, body, tags, status, created_at, updated_at`,
      values
    )

    return sendSuccess(res, 200, updatedReview.rows[0])
  } catch (error) {
    return next(error)
  }
}

export async function deleteReview(req, res, next) {
  try {
    const { id } = req.validated.params

    const existingReview = await pool.query(
      `SELECT id, user_id
       FROM reviews
       WHERE id = $1`,
      [id]
    )

    if (!existingReview.rows[0]) {
      return sendError(res, 404, 'REVIEW_NOT_FOUND', 'Resena no encontrada')
    }

    if (existingReview.rows[0].user_id !== req.user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'No tienes permiso')
    }

    await pool.query(
      `DELETE FROM reviews
       WHERE id = $1`,
      [id]
    )

    return sendSuccess(res, 200, { message: 'Resena eliminada correctamente' })
  } catch (error) {
    return next(error)
  }
}
