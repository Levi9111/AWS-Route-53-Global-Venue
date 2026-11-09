import { Router } from 'express';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { VenueRoutes } from '../modules/Venue/venue.route';
import { BookingRoutes } from '../modules/Booking/booking.route';
import { ReviewRoutes } from '../modules/Review/review.route';
// --- INJECT IMPORTS HERE ---

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/venues', route: VenueRoutes },
  { path: '/bookings', route: BookingRoutes },
  { path: '/reviews', route: ReviewRoutes },
  // --- INJECT ROUTES HERE ---
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
