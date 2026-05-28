import { Router } from 'express'

import {
  createReview,
  deleteReview,
  getReviewById,
  getReviews,
  updateReview,
} from '../controllers/reviews.controller.js'
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
  createReviewSchema,
  listReviewsSchema,
  reviewParamsSchema,
  updateReviewSchema,
} from '../schemas/reviews.schemas.js'

const router = Router()

router.get('/', validate(listReviewsSchema), getReviews)
router.post('/', requireAuth, validate(createReviewSchema), createReview)
router.get('/:id', optionalAuth, validate(reviewParamsSchema), getReviewById)
router.patch('/:id', requireAuth, validate(updateReviewSchema), updateReview)
router.delete('/:id', requireAuth, validate(reviewParamsSchema), deleteReview)

export default router
