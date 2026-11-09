import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BookingService } from './booking.service';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.createBooking(req.user.userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.getMyBookings(req.user.userId, {
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    status: req.query.status as string | undefined,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bookings fetched successfully',
    page: result.page,
    limit: result.limit,
    total: result.total,
    data: result.data,
  });
});

const getVenueBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.getVenueBookings(
    String(req.params.venueId),
    req.user.userId,
    req.user.role,
    {
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    },
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Venue bookings fetched successfully',
    page: result.page,
    limit: result.limit,
    total: result.total,
    data: result.data,
  });
});

const getHostBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.getHostBookings(req.user.userId, {
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Host bookings fetched successfully',
    page: result.page,
    limit: result.limit,
    total: result.total,
    data: result.data,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.cancelBooking(
    String(req.params.id),
    req.user.userId,
    req.user.role,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Booking cancelled successfully',
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.updateBookingStatus(
    String(req.params.id),
    req.user.userId,
    req.user.role,
    req.body.status,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Booking status updated successfully',
    data: result,
  });
});

export const BookingControllers = {
  createBooking,
  getMyBookings,
  getVenueBookings,
  getHostBookings,
  cancelBooking,
  updateBookingStatus,
};
