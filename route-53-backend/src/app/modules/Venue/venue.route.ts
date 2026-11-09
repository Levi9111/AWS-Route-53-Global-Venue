import express from 'express';
import { VenueControllers } from './venue.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import validateRequest from '../../utils/validateRequest';
import { VenueValidation } from './venue.validation';

const router = express.Router();

router.get('/', VenueControllers.getAllVenues);
router.get('/:id/reviews', VenueControllers.getVenueReviews);
router.get('/:id', VenueControllers.getVenueById);

router.post(
  '/',
  requireAuth,
  requireRole('host'),
  validateRequest(VenueValidation.createVenueSchema),
  VenueControllers.createVenue,
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('host'),
  validateRequest(VenueValidation.updateVenueSchema),
  VenueControllers.updateVenue,
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('host'),
  VenueControllers.deleteVenue,
);

export const VenueRoutes = router;
