import { apiRequest } from './client';
import { PaginatedResponse, SingleResponse, Venue } from './types';

export interface VenueSearchFilters {
  city?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number | string;
  minPrice?: number | string; // cents
  maxPrice?: number | string; // cents
  amenities?: string[];
  hostId?: string;
  page?: number;
  limit?: number;
}

export interface UpsertVenueInput {
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
}

export const venuesApi = {
  async list(
    filters: VenueSearchFilters = {},
  ): Promise<PaginatedResponse<Venue>> {
    const params = new URLSearchParams();

    if (filters.city) params.set('city', filters.city);
    if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.capacity !== undefined && filters.capacity !== '') {
      params.set('capacity', String(filters.capacity));
    }
    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      params.set('minPrice', String(filters.minPrice));
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      params.set('maxPrice', String(filters.maxPrice));
    }
    if (filters.amenities && filters.amenities.length > 0) {
      params.set('amenities', filters.amenities.join(','));
    }
    if (filters.hostId) params.set('hostId', filters.hostId);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return apiRequest<PaginatedResponse<Venue>>(
      `/api/venues${qs ? `?${qs}` : ''}`,
    );
  },

  async getById(id: string): Promise<Venue> {
    const res = await apiRequest<SingleResponse<Venue>>(`/api/venues/${id}`);
    return res.data;
  },

  async create(input: UpsertVenueInput): Promise<Venue> {
    const res = await apiRequest<SingleResponse<Venue>>('/api/venues', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async update(
    id: string,
    input: Partial<UpsertVenueInput>,
  ): Promise<Venue> {
    const res = await apiRequest<SingleResponse<Venue>>(`/api/venues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    const res = await apiRequest<
      SingleResponse<{ deleted: boolean; id: string }>
    >(`/api/venues/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};
