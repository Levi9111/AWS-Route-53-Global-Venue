import express from 'express';
import { BookingControllers } from './booking.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import validateRequest from '../../utils/validateRequest';
import { BookingValidation } from './booking.validation';

const router = express.Router();

router.post(
  '/',
  requireAuth,
  validateRequest(BookingValidation.createBookingSchema),
  BookingControllers.createBooking,
);

router.get('/mine', requireAuth, BookingControllers.getMyBookings);

router.get(
  '/host',
  requireAuth,
  requireRole('host'),
  BookingControllers.getHostBookings,
);

router.get(
  '/venue/:venueId',
  requireAuth,
  requireRole('host'),
  BookingControllers.getVenueBookings,
);

router.patch('/:id/cancel', requireAuth, BookingControllers.cancelBooking);

router.patch(
  '/:id/status',
  requireAuth,
  validateRequest(BookingValidation.updateStatusSchema),
  BookingControllers.updateBookingStatus,
);

export const BookingRoutes = router;
