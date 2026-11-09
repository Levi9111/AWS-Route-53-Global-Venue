import { apiRequest } from './client';
import { PaginatedResponse, Review, SingleResponse } from './types';

export const reviewsApi = {
  async create(input: {
    bookingId: string;
    venueId?: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    const res = await apiRequest<SingleResponse<Review>>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async getByVenue(
    venueId: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<Review>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest<PaginatedResponse<Review>>(
      `/api/venues/${venueId}/reviews${query ? `?${query}` : ''}`,
    );
  },
};
