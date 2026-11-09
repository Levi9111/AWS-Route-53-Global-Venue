import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { TCreateReviewPayload } from './review.interface';
import { ReviewModel } from './review.model';
import { BookingModel } from '../Booking/booking.model';

const createReview = async (
  authorId: string,
  payload: TCreateReviewPayload,
) => {
  if (!Types.ObjectId.isValid(payload.bookingId)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid booking ID',
      'INVALID_ID',
    );
  }

  const booking = await BookingModel.findById(payload.bookingId);
  if (!booking) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Booking not found',
      'BOOKING_NOT_FOUND',
    );
  }

  if (booking.renterId.toString() !== authorId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You can only review your own bookings',
      'FORBIDDEN',
    );
  }

  if (booking.status !== 'completed') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Reviews can only be submitted after a completed booking',
      'BOOKING_NOT_COMPLETED',
    );
  }

  const existing = await ReviewModel.findOne({
    bookingId: new Types.ObjectId(payload.bookingId),
  });
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      'A review has already been submitted for this booking',
      'REVIEW_ALREADY_EXISTS',
    );
  }

  const created = await ReviewModel.create({
    bookingId: new Types.ObjectId(payload.bookingId),
    authorId: new Types.ObjectId(authorId),
    venueId: new Types.ObjectId(booking.venueId.toString()),
    rating: payload.rating,
    comment: payload.comment,
  });

  const populated = await ReviewModel.findById(created._id).populate(
    'authorId',
    'name email',
  );

  return populated;
};

const getReviewsByVenue = async (
  venueId: string,
  query: { page?: string | number; limit?: string | number },
) => {
  if (!Types.ObjectId.isValid(venueId)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid venue ID',
      'INVALID_ID',
    );
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { venueId: new Types.ObjectId(venueId) };
  const [reviews, total] = await Promise.all([
    ReviewModel.find(filter)
      .populate('authorId', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    ReviewModel.countDocuments(filter),
  ]);

  return {
    data: reviews,
    page,
    limit,
    total,
  };
};

export const ReviewService = {
  createReview,
  getReviewsByVenue,
};
