import { apiRequest } from './client';
import {
  Booking,
  BookingStatus,
  PaginatedResponse,
  SingleResponse,
} from './types';

export const bookingsApi = {
  async create(input: {
    venueId: string;
    startTime: string;
    endTime: string;
  }): Promise<Booking> {
    const res = await apiRequest<SingleResponse<Booking>>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async getMine(
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<PaginatedResponse<Booking>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status);
    const query = qs.toString();
    return apiRequest<PaginatedResponse<Booking>>(
      `/api/bookings/mine${query ? `?${query}` : ''}`,
    );
  },

  async getByVenue(
    venueId: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<Booking>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest<PaginatedResponse<Booking>>(
      `/api/bookings/venue/${venueId}${query ? `?${query}` : ''}`,
    );
  },

  async getHostBookings(
    params: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<Booking>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest<PaginatedResponse<Booking>>(
      `/api/bookings/host${query ? `?${query}` : ''}`,
    );
  },

  async cancel(bookingId: string): Promise<Booking> {
    const res = await apiRequest<SingleResponse<Booking>>(
      `/api/bookings/${bookingId}/cancel`,
      {
        method: 'PATCH',
      },
    );
    return res.data;
  },

  async updateStatus(
    bookingId: string,
    status: BookingStatus,
  ): Promise<Booking> {
    const res = await apiRequest<SingleResponse<Booking>>(
      `/api/bookings/${bookingId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
    return res.data;
  },
};
