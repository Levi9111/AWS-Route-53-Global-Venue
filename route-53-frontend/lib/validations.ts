import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),
  role: z.enum(['renter', 'host']),
});

export const venueFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(140, 'Title must be at most 140 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  address: z.string().trim().min(3, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  country: z.string().trim().min(2, 'Country is required'),
  lat: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  lng: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1 guest'),
  pricePerHourDollars: z
    .number()
    .min(1, 'Price per hour must be at least $1.00'),
  amenities: z.array(z.string().trim().min(1)),
  photos: z.array(z.string().url('Each photo must be a valid URL')),
  instantBook: z.boolean(),
});

export const bookingFormSchema = z
  .object({
    venueId: z.string().min(1, 'Venue ID is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end > start
      );
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    },
  );

export const reviewFormSchema = z.object({
  bookingId: z.string().min(1, 'Booking selection is required'),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .trim()
    .min(3, 'Review comment must be at least 3 characters')
    .max(2000, 'Review comment must be at most 2000 characters'),
});

export function extractFieldErrors<T>(
  zodError: z.ZodError<T>,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || 'form';
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
