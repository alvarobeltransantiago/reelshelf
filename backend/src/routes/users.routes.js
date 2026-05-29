import { Router } from 'express'

import {
  createWishlistItem,
  deleteMe,
  deleteWishlistItem,
  downloadMyBackup,
  getMyLibrary,
  getMyWishlist,
  getPublicProfile,
  getUserReviews,
  reorderWishlist,
  updateMe,
  updateMyTopReviews,
  updateWishlistItem,
} from '../controllers/users.controller.js'
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
  meLibrarySchema,
  reorderWishlistSchema,
  updateMeSchema,
  updateTopReviewsSchema,
  updateWishlistItemSchema,
  userReviewsSchema,
  wishlistItemParamsSchema,
  wishlistPayloadSchema,
  wishlistQuerySchema,
  usernameParamsSchema,
} from '../schemas/users.schemas.js'

const router = Router()

router.get('/me/library', requireAuth, validate(meLibrarySchema), getMyLibrary)
router.patch('/me/top-reviews', requireAuth, validate(updateTopReviewsSchema), updateMyTopReviews)
router.get('/me/wishlist', requireAuth, validate(wishlistQuerySchema), getMyWishlist)
router.post('/me/wishlist', requireAuth, validate(wishlistPayloadSchema), createWishlistItem)
router.patch('/me/wishlist/reorder', requireAuth, validate(reorderWishlistSchema), reorderWishlist)
router.patch('/me/wishlist/:id', requireAuth, validate(updateWishlistItemSchema), updateWishlistItem)
router.delete('/me/wishlist/:id', requireAuth, validate(wishlistItemParamsSchema), deleteWishlistItem)
router.get('/me/backup', requireAuth, downloadMyBackup)
router.patch('/me', requireAuth, validate(updateMeSchema), updateMe)
router.delete('/me', requireAuth, deleteMe)
router.get('/:username', validate(usernameParamsSchema), getPublicProfile)
router.get('/:username/reviews', optionalAuth, validate(userReviewsSchema), getUserReviews)

export default router
