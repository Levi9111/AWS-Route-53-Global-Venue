import mongoose, { FilterQuery, Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { IVenue, TVenueQuery } from './venue.interface';
import { VenueModel } from './venue.model';
import { venueSearchableFields } from './venue.constant';

const getAllVenues = async (query: TVenueQuery) => {
  const filter: FilterQuery<IVenue> = {};

  if (query.searchTerm && String(query.searchTerm).trim()) {
    const term = String(query.searchTerm).trim();
    filter.$or = venueSearchableFields.map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    }));
  }

  if (query.city && String(query.city).trim()) {
    filter.city = {
      $regex: String(query.city).trim(),
      $options: 'i',
    };
  }

  if (query.country && String(query.country).trim()) {
    filter.country = {
      $regex: String(query.country).trim(),
      $options: 'i',
    };
  }

  if (query.hostId && Types.ObjectId.isValid(String(query.hostId))) {
    filter.hostId = new Types.ObjectId(String(query.hostId));
  }

  if (query.capacity !== undefined && query.capacity !== '') {
    const minCap = Number(query.capacity);
    if (!Number.isNaN(minCap) && minCap > 0) {
      filter.capacity = { $gte: minCap };
    }
  }

  if (
    (query.minPrice !== undefined && query.minPrice !== '') ||
    (query.maxPrice !== undefined && query.maxPrice !== '')
  ) {
    const priceFilter: Record<string, number> = {};
    if (query.minPrice !== undefined && query.minPrice !== '') {
      const minP = Number(query.minPrice);
      if (!Number.isNaN(minP)) priceFilter.$gte = minP;
    }
    if (query.maxPrice !== undefined && query.maxPrice !== '') {
      const maxP = Number(query.maxPrice);
      if (!Number.isNaN(maxP)) priceFilter.$lte = maxP;
    }
    if (Object.keys(priceFilter).length > 0) {
      filter.pricePerHour = priceFilter;
    }
  }

  if (query.amenities) {
    const list = Array.isArray(query.amenities)
      ? query.amenities
      : String(query.amenities)
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
    if (list.length > 0) {
      filter.amenities = {
        $all: list.map((item) => new RegExp(`^${item}$`, 'i')),
      };
    }
  }

  if (query.instantBook !== undefined && query.instantBook !== '') {
    if (query.instantBook === 'true' || query.instantBook === true) {
      filter.instantBook = true;
    } else if (query.instantBook === 'false' || query.instantBook === false) {
      filter.instantBook = false;
    }
  }

  // Date range availability check against existing bookings
  const rawStart = query.startDate || query.date;
  const rawEnd = query.endDate;
  if (rawStart) {
    const start = new Date(String(rawStart));
    const end = rawEnd
      ? new Date(String(rawEnd))
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end > start
    ) {
      const Booking = mongoose.models.Booking;
      if (Booking) {
        const overlappingVenueIds = await Booking.distinct('venueId', {
          status: { $in: ['pending', 'confirmed'] },
          startTime: { $lt: end },
          endTime: { $gt: start },
        });
        if (overlappingVenueIds.length > 0) {
          filter._id = { $nin: overlappingVenueIds };
        }
      }
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 12));
  const skip = (page - 1) * limit;

  const sortStr = query.sort
    ? String(query.sort).split(',').join(' ')
    : '-createdAt';

  const [venues, total] = await Promise.all([
    VenueModel.find(filter)
      .populate('hostId', 'name email role')
      .sort(sortStr)
      .skip(skip)
      .limit(limit)
      .lean(),
    VenueModel.countDocuments(filter),
  ]);

  return {
    data: venues,
    page,
    limit,
    total,
  };
};

const getVenueById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid venue ID',
      'INVALID_ID',
    );
  }

  const venue = await VenueModel.findById(id)
    .populate('hostId', 'name email role')
    .lean();

  if (!venue) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Venue not found',
      'VENUE_NOT_FOUND',
    );
  }

  // Attach active upcoming booked slots so the calendar widget can show busy times
  let bookedSlots: unknown[] = [];
  const Booking = mongoose.models.Booking;
  if (Booking) {
    bookedSlots = await Booking.find({
      venueId: new Types.ObjectId(id),
      status: { $in: ['pending', 'confirmed'] },
      endTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .select('_id startTime endTime status')
      .sort('startTime')
      .lean();
  }

  // Attach rating summary
  let averageRating = 0;
  let reviewCount = 0;
  const Review = mongoose.models.Review;
  if (Review) {
    const stats = await Review.aggregate([
      { $match: { venueId: new Types.ObjectId(id) } },
      {
        $group: {
          _id: '$venueId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    if (stats.length > 0) {
      averageRating = Number(stats[0].averageRating.toFixed(2));
      reviewCount = stats[0].reviewCount;
    }
  }

  return {
    ...venue,
    bookedSlots,
    averageRating,
    reviewCount,
  };
};

const createVenue = async (hostId: string, payload: Omit<IVenue, 'hostId'>) => {
  const venue = await VenueModel.create({
    ...payload,
    hostId: new Types.ObjectId(hostId),
  });
  return venue;
};

const updateVenue = async (
  id: string,
  userId: string,
  userRole: string,
  payload: Partial<IVenue>,
) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid venue ID',
      'INVALID_ID',
    );
  }

  const venue = await VenueModel.findById(id);
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
      'You can only edit your own venues',
      'FORBIDDEN',
    );
  }

  const updated = await VenueModel.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true },
  );

  return updated;
};

const deleteVenue = async (id: string, userId: string, userRole: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid venue ID',
      'INVALID_ID',
    );
  }

  const venue = await VenueModel.findById(id);
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
      'You can only delete your own venues',
      'FORBIDDEN',
    );
  }

  await VenueModel.findByIdAndDelete(id);
  return { deleted: true, id };
};

const getVenueReviews = async (
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

  const Review = mongoose.models.Review;
  if (!Review) {
    return { data: [], page, limit, total: 0 };
  }

  const filter = { venueId: new Types.ObjectId(venueId) };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('authorId', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return { data: reviews, page, limit, total };
};

export const VenueService = {
  getAllVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueReviews,
};
