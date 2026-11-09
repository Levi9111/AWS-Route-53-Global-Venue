import mongoose from 'mongoose';
import { BookingModel } from './booking.model';
import { IBooking, TCreateBookingPayload } from './booking.interface';
import { IVenue } from '../Venue/venue.interface';

/**
 * Checks whether an event timeslot conflicts with existing active bookings.
 */
export async function checkSlotAvailability(
  venueId: string | mongoose.Types.ObjectId,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string | mongoose.Types.ObjectId,
): Promise<{ available: boolean; conflict?: IBooking }> {
  const query: Record<string, unknown> = {
    venueId: new mongoose.Types.ObjectId(String(venueId)),
    status: { $in: ['pending', 'confirmed'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeBookingId) {
    query._id = { $ne: new mongoose.Types.ObjectId(String(excludeBookingId)) };
  }

  const conflict = (await BookingModel.findOne(query).lean()) as IBooking | null;
  return {
    available: !conflict,
    conflict: conflict || undefined,
  };
}

/**
 * Calculates pricing for a venue reservation based on start and end time.
 * Always works in integer cents to prevent floating point inaccuracies.
 */
export function calculateBookingPrice(
  venue: Pick<IVenue, 'pricePerHour'>,
  startTime: Date,
  endTime: Date,
): { durationHours: number; totalPriceCents: number } {
  const diffMs = endTime.getTime() - startTime.getTime();
  if (diffMs <= 0) {
    throw new Error('End time must be after start time');
  }
  const durationHours = diffMs / (1000 * 60 * 60);
  const totalPriceCents = Math.round(durationHours * venue.pricePerHour);
  return { durationHours, totalPriceCents };
}

/**
 * Validates ISO date strings ensuring end time succeeds start time.
 */
export function validateBookingDates(
  payload: Pick<TCreateBookingPayload, 'startTime' | 'endTime'>,
): { start: Date; end: Date; durationHours: number } {
  const start = new Date(payload.startTime);
  const end = new Date(payload.endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid ISO 8601 date string provided');
  }

  if (end <= start) {
    throw new Error('End time must be after start time');
  }

  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return { start, end, durationHours };
}
