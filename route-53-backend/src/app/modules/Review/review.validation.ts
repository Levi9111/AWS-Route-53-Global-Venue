import { z } from 'zod';

const createReviewSchema = z.object({
  body: z.object({
    bookingId: z
      .string({ required_error: 'bookingId is required' })
      .trim()
      .min(1, 'bookingId is required'),
    venueId: z.string().trim().optional(),
    rating: z
      .number({ required_error: 'Rating is required' })
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5'),
    comment: z
      .string({ required_error: 'Comment is required' })
      .trim()
      .min(3, 'Comment must be at least 3 characters')
      .max(2000, 'Comment must be at most 2000 characters'),
  }),
});

export const ReviewValidation = {
  createReviewSchema,
};
