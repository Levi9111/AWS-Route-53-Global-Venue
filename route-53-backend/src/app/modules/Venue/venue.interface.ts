import { Types } from 'mongoose';

export interface IVenue {
  _id?: Types.ObjectId;
  hostId: Types.ObjectId | string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  capacity: number;
  pricePerHour: number; // integer cents
  amenities: string[];
  photos: string[];
  instantBook: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TVenueQuery = {
  city?: string;
  country?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  capacity?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
  amenities?: string | string[];
  hostId?: string;
  instantBook?: string | boolean;
  page?: string | number;
  limit?: string | number;
  sort?: string;
};
