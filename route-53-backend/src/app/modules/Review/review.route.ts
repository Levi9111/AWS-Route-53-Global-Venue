import express from 'express';
import { ReviewControllers } from './review.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import validateRequest from '../../utils/validateRequest';
import { ReviewValidation } from './review.validation';

const router = express.Router();

router.post(
  '/',
  requireAuth,
  validateRequest(ReviewValidation.createReviewSchema),
  ReviewControllers.createReview,
);

router.get('/venue/:venueId', ReviewControllers.getReviewsByVenue);
router.get('/', ReviewControllers.getReviewsByVenue);

export const ReviewRoutes = router;
