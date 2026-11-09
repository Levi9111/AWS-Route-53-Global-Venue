import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewService } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.createReview(req.user.userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Review submitted successfully',
    data: result,
  });
});

const getReviewsByVenue = catchAsync(async (req: Request, res: Response) => {
  const venueId = String(req.params.venueId || req.query.venueId || '');
  const result = await ReviewService.getReviewsByVenue(venueId, {
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reviews fetched successfully',
    page: result.page,
    limit: result.limit,
    total: result.total,
    data: result.data,
  });
});

export const ReviewControllers = {
  createReview,
  getReviewsByVenue,
};
