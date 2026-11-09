import { z } from 'zod';

const createVenueSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(140, 'Title must be at most 140 characters'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must be at most 5000 characters'),
    address: z
      .string({ required_error: 'Address is required' })
      .trim()
      .min(3, 'Address must be at least 3 characters'),
    city: z
      .string({ required_error: 'City is required' })
      .trim()
      .min(2, 'City must be at least 2 characters'),
    country: z
      .string({ required_error: 'Country is required' })
      .trim()
      .min(2, 'Country must be at least 2 characters'),
    lat: z
      .number({ required_error: 'Latitude is required' })
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    lng: z
      .number({ required_error: 'Longitude is required' })
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
    capacity: z
      .number({ required_error: 'Capacity is required' })
      .int('Capacity must be a whole number')
      .min(1, 'Capacity must be at least 1'),
    pricePerHour: z
      .number({ required_error: 'Price per hour (in cents) is required' })
      .int('Price per hour must be an integer in cents')
      .min(100, 'Price per hour must be at least 100 cents ($1.00)'),
    amenities: z.array(z.string().trim().min(1)).optional().default([]),
    photos: z
      .array(z.string().url('Each photo must be a valid URL'))
      .optional()
      .default([]),
    instantBook: z.boolean().optional().default(true),
  }),
});

const updateVenueSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(140).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    address: z.string().trim().min(3).optional(),
    city: z.string().trim().min(2).optional(),
    country: z.string().trim().min(2).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    capacity: z.number().int().min(1).optional(),
    pricePerHour: z.number().int().min(100).optional(),
    amenities: z.array(z.string().trim().min(1)).optional(),
    photos: z.array(z.string().url()).optional(),
    instantBook: z.boolean().optional(),
  }),
});

export const VenueValidation = {
  createVenueSchema,
  updateVenueSchema,
};
