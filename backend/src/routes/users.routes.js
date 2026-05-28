import { Router } from 'express'

import {
  deleteMe,
  getMyLibrary,
  getPublicProfile,
  getUserReviews,
  updateMe,
  updateMyTopReviews,
} from '../controllers/users.controller.js'
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
  meLibrarySchema,
  updateMeSchema,
  updateTopReviewsSchema,
  userReviewsSchema,
  usernameParamsSchema,
} from '../schemas/users.schemas.js'

const router = Router()

router.get('/me/library', requireAuth, validate(meLibrarySchema), getMyLibrary)
router.patch('/me/top-reviews', requireAuth, validate(updateTopReviewsSchema), updateMyTopReviews)
router.patch('/me', requireAuth, validate(updateMeSchema), updateMe)
router.delete('/me', requireAuth, deleteMe)
router.get('/:username', validate(usernameParamsSchema), getPublicProfile)
router.get('/:username/reviews', optionalAuth, validate(userReviewsSchema), getUserReviews)

export default router
