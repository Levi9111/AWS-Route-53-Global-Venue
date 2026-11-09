import { Types } from 'mongoose';

export interface IReview {
  _id?: Types.ObjectId;
  bookingId: Types.ObjectId | string;
  authorId: Types.ObjectId | string;
  venueId: Types.ObjectId | string;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TCreateReviewPayload = {
  bookingId: string;
  venueId?: string;
  rating: number;
  comment: string;
};
