import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VenueService } from './venue.service';
import { TVenueQuery } from './venue.interface';

const getAllVenues = catchAsync(async (req: Request, res: Response) => {
  const result = await VenueService.getAllVenues(req.query as TVenueQuery);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Venues fetched successfully',
    page: result.page,
    limit: result.limit,
    total: result.total,
    data: result.data,
  });
});

const getVenueById = catchAsync(async (req: Request, res: Response) => {
  const result = await VenueService.getVenueById(String(req.params.id));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Venue fetched successfully',
    data: result,
  });
});

const createVenue = catchAsync(async (req: Request, res: Response) => {
  const result = await VenueService.createVenue(req.user.userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Venue created successfully',
    data: result,
  });
});

const updateVenue = catchAsync(async (req: Request, res: Response) => {
  const result = await VenueService.updateVenue(
    String(req.params.id),
    req.user.userId,
    req.user.role,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Venue updated successfully',
    data: result,
  });
});

const deleteVenue = catchAsync(async (req: Request, res: Response) => {
  const result = await VenueService.deleteVenue(
    String(req.params.id),
    req.user.userId,
    req.user.role,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Venue deleted successfully',
    data: result,
  });
});

const getVenueReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await VenueService.getVenueReviews(String(req.params.id), {
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Venue reviews fetched successfully',
    page: result.page,
    limit: result.limit,
    total: result.total,
    data: result.data,
  });
});

export const VenueControllers = {
  getAllVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueReviews,
};
