import { z } from 'zod';

const createBookingSchema = z.object({
  body: z
    .object({
      venueId: z
        .string({ required_error: 'venueId is required' })
        .trim()
        .min(1, 'venueId is required'),
      startTime: z
        .string({ required_error: 'startTime is required' })
        .datetime({ offset: true, message: 'startTime must be a valid ISO 8601 date' })
        .or(
          z
            .string()
            .refine((val) => !Number.isNaN(Date.parse(val)), {
              message: 'startTime must be a valid ISO 8601 date string',
            }),
        ),
      endTime: z
        .string({ required_error: 'endTime is required' })
        .datetime({ offset: true, message: 'endTime must be a valid ISO 8601 date' })
        .or(
          z
            .string()
            .refine((val) => !Number.isNaN(Date.parse(val)), {
              message: 'endTime must be a valid ISO 8601 date string',
            }),
        ),
    })
    .refine(
      (data) => {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return end > start;
      },
      {
        message: 'endTime must be after startTime',
        path: ['endTime'],
      },
    ),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['confirmed', 'completed', 'cancelled']),
  }),
});

export const BookingValidation = {
  createBookingSchema,
  updateStatusSchema,
};
