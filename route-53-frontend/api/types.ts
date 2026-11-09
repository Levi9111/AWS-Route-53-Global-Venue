export type UserRole = 'renter' | 'host' | 'admin';

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface BookedSlot {
  _id: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed';
}

export interface Venue {
  _id: string;
  hostId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role?: UserRole;
      };
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
  createdAt: string;
  bookedSlots?: BookedSlot[];
  averageRating?: number;
  reviewCount?: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  venueId: Venue | string;
  renterId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number; // integer cents
  createdAt: string;
}

export interface Review {
  _id: string;
  bookingId: string;
  authorId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  venueId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface SingleResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
