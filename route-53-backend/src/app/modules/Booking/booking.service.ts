import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { TCreateBookingPayload, TBookingStatus } from './booking.interface';
import { BookingModel } from './booking.model';
import { VenueModel } from '../Venue/venue.model';

const createBooking = async (
  renterId: string,
  payload: TCreateBookingPayload,
) => {
  if (!Types.ObjectId.isValid(payload.venueId)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid venue ID',
      'INVALID_ID',
    );
  }

  const start = new Date(payload.startTime);
  const end = new Date(payload.endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid startTime or endTime',
      'INVALID_DATES',
    );
  }

  if (end <= start) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'endTime must be after startTime',
      'INVALID_TIME_RANGE',
    );
  }

  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (durationHours < 0.5) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Minimum booking duration is 30 minutes',
      'MINIMUM_DURATION_NOT_MET',
    );
  }

  const venue = await VenueModel.findById(payload.venueId);
  if (!venue) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Venue not found',
      'VENUE_NOT_FOUND',
    );
  }

  // Server-side availability check: prevent overlapping bookings
  const venueObjectId = new Types.ObjectId(payload.venueId);
  const existingOverlap = await BookingModel.findOne({
    venueId: venueObjectId,
    status: { $in: ['pending', 'confirmed'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  });

  if (existingOverlap) {
    throw new AppError(
      StatusCodes.CONFLICT,
      'This venue is already booked during the selected time slot',
      'TIME_SLOT_UNAVAILABLE',
    );
  }

  const totalPrice = Math.round(durationHours * venue.pricePerHour);
  const initialStatus: TBookingStatus = venue.instantBook
    ? 'confirmed'
    : 'pending';

  let created;
  try {
    created = await BookingModel.create({
      venueId: venueObjectId,
      renterId: new Types.ObjectId(renterId),
      startTime: start,
      endTime: end,
      status: initialStatus,
      totalPrice,
    });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr?.code === 11000) {
      throw new AppError(
        StatusCodes.CONFLICT,
        'This venue is already booked during the selected time slot',
        'TIME_SLOT_UNAVAILABLE',
      );
    }
    throw err;
  }

  // Post-insert race-condition guard for overlapping ranges across concurrent instances
  const concurrentOverlaps = await BookingModel.find({
    venueId: venueObjectId,
    status: { $in: ['pending', 'confirmed'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  })
    .sort({ createdAt: 1, _id: 1 })
    .select('_id')
    .lean();

  if (
    concurrentOverlaps.length > 1 &&
    concurrentOverlaps[0]._id.toString() !== created._id.toString()
  ) {
    await BookingModel.findByIdAndDelete(created._id);
    throw new AppError(
      StatusCodes.CONFLICT,
      'This venue was just booked by another user for an overlapping time slot',
      'TIME_SLOT_UNAVAILABLE',
    );
  }

  const populated = await BookingModel.findById(created._id)
    .populate('venueId', 'title city country address pricePerHour photos instantBook hostId')
    .populate('renterId', 'name email');

  return populated;
};

const getMyBookings = async (
  renterId: string,
  query: { page?: string | number; limit?: string | number; status?: string },
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    renterId: new Types.ObjectId(renterId),
  };

  if (query.status) {
    filter.status = query.status;
  }

  const [bookings, total] = await Promise.all([
    BookingModel.find(filter)
      .populate(
        'venueId',
        'title city country address pricePerHour photos capacity instantBook',
      )
      .sort('-startTime')
      .skip(skip)
      .limit(limit)
      .lean(),
    BookingModel.countDocuments(filter),
  ]);

  return {
    data: bookings,
    page,
    limit,
    total,
  };
};

const getVenueBookings = async (
  venueId: string,
  userId: string,
  userRole: string,
  query: { page?: string | number; limit?: string | number },
) => {
  if (!Types.ObjectId.isValid(venueId)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid venue ID',
      'INVALID_ID',
    );
  }

  const venue = await VenueModel.findById(venueId);
  if (!venue) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Venue not found',
      'VENUE_NOT_FOUND',
    );
  }

  if (venue.hostId.toString() !== userId && userRole !== 'admin') {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You can only view bookings for your own venues',
      'FORBIDDEN',
    );
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { venueId: new Types.ObjectId(venueId) };

  const [bookings, total] = await Promise.all([
    BookingModel.find(filter)
      .populate('renterId', 'name email')
      .populate('venueId', 'title city country pricePerHour photos')
      .sort('-startTime')
      .skip(skip)
      .limit(limit)
      .lean(),
    BookingModel.countDocuments(filter),
  ]);

  return {
    data: bookings,
    page,
    limit,
    total,
  };
};

const getHostBookings = async (
  hostId: string,
  query: { page?: string | number; limit?: string | number },
) => {
  const hostVenues = await VenueModel.find({
    hostId: new Types.ObjectId(hostId),
  })
    .select('_id')
    .lean();

  const venueIds = hostVenues.map((v) => v._id);

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  if (venueIds.length === 0) {
    return { data: [], page, limit, total: 0 };
  }

  const filter = { venueId: { $in: venueIds } };

  const [bookings, total] = await Promise.all([
    BookingModel.find(filter)
      .populate('renterId', 'name email')
      .populate('venueId', 'title city country pricePerHour photos')
      .sort('-startTime')
      .skip(skip)
      .limit(limit)
      .lean(),
    BookingModel.countDocuments(filter),
  ]);

  return {
    data: bookings,
    page,
    limit,
    total,
  };
};

const cancelBooking = async (
  bookingId: string,
  userId: string,
  userRole: string,
) => {
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid booking ID',
      'INVALID_ID',
    );
  }

  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Booking not found',
      'BOOKING_NOT_FOUND',
    );
  }

  const venue = await VenueModel.findById(booking.venueId);
  const isRenter = booking.renterId.toString() === userId;
  const isHost = venue && venue.hostId.toString() === userId;

  if (!isRenter && !isHost && userRole !== 'admin') {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to cancel this booking',
      'FORBIDDEN',
    );
  }

  if (booking.status === 'cancelled') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Booking is already cancelled',
      'ALREADY_CANCELLED',
    );
  }

  if (booking.status === 'completed') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Completed bookings cannot be cancelled',
      'CANNOT_CANCEL_COMPLETED',
    );
  }

  booking.status = 'cancelled';
  await booking.save();

  return booking;
};

const updateBookingStatus = async (
  bookingId: string,
  userId: string,
  userRole: string,
  status: TBookingStatus,
) => {
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid booking ID',
      'INVALID_ID',
    );
  }

  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Booking not found',
      'BOOKING_NOT_FOUND',
    );
  }

  const venue = await VenueModel.findById(booking.venueId);
  const isRenter = booking.renterId.toString() === userId;
  const isHost = venue && venue.hostId.toString() === userId;

  if (status === 'confirmed' && !isHost && userRole !== 'admin') {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only the venue host can confirm a booking',
      'FORBIDDEN',
    );
  }

  if (status === 'completed' && !isHost && !isRenter && userRole !== 'admin') {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update this booking',
      'FORBIDDEN',
    );
  }

  booking.status = status;
  await booking.save();

  return booking;
};

export const BookingService = {
  createBooking,
  getMyBookings,
  getVenueBookings,
  getHostBookings,
  cancelBooking,
  updateBookingStatus,
};
