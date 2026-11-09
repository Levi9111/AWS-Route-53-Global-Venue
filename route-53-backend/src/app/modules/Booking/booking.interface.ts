import { Types } from 'mongoose';

export type TBookingStatus =
  'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface IBooking {
  _id?: Types.ObjectId;
  venueId: Types.ObjectId | string;
  renterId: Types.ObjectId | string;
  startTime: Date;
  endTime: Date;
  status: TBookingStatus;
  totalPrice: number; // integer cents
  createdAt?: Date;
  updatedAt?: Date;
}

export type TCreateBookingPayload = {
  venueId: string;
  startTime: string;
  endTime: string;
};
