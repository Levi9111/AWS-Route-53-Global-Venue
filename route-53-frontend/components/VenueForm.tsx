'use client';

import React, { useState } from 'react';
import { UpsertVenueInput } from '../api/venues';
import { Venue } from '../api/types';
import { centsToDollars, dollarsToCents } from '../api/client';
import { extractFieldErrors, venueFormSchema } from '../lib/validations';

interface VenueFormProps {
  initialVenue?: Venue;
  onSubmit: (payload: UpsertVenueInput) => Promise<void>;
  submitLabel: string;
}

const CITY_PRESETS = [
  { city: 'New York', country: 'United States', lat: 40.7209, lng: -74.0007 },
  { city: 'London', country: 'United Kingdom', lat: 51.5245, lng: -0.0745 },
  { city: 'Dublin', country: 'Ireland', lat: 53.3441, lng: -6.2375 },
  {
    city: 'San Francisco',
    country: 'United States',
    lat: 37.7631,
    lng: -122.4128,
  },
  { city: 'Berlin', country: 'Germany', lat: 52.5065, lng: 13.4285 },
  { city: 'Tokyo', country: 'Japan', lat: 35.658, lng: 139.7016 },
];

const SUGGESTED_AMENITIES = [
  'WiFi',
  'Projector',
  'Sound System',
  'Catering Kitchen',
  'Stage',
  'Rooftop Access',
  'Whiteboards',
  'Video Conferencing',
  'Lighting Rig',
  'VIP Lounge',
];

export function VenueForm({
  initialVenue,
  onSubmit,
  submitLabel,
}: VenueFormProps) {
  const [title, setTitle] = useState(initialVenue?.title || '');
  const [description, setDescription] = useState(
    initialVenue?.description || '',
  );
  const [address, setAddress] = useState(initialVenue?.address || '');
  const [city, setCity] = useState(initialVenue?.city || 'New York');
  const [country, setCountry] = useState(
    initialVenue?.country || 'United States',
  );
  const [lat, setLat] = useState<string>(
    initialVenue ? String(initialVenue.lat) : '40.7209',
  );
  const [lng, setLng] = useState<string>(
    initialVenue ? String(initialVenue.lng) : '-74.0007',
  );
  const [capacity, setCapacity] = useState<string>(
    initialVenue ? String(initialVenue.capacity) : '100',
  );
  const [priceDollars, setPriceDollars] = useState<string>(
    initialVenue
      ? String(centsToDollars(initialVenue.pricePerHour))
      : '250',
  );
  const [amenities, setAmenities] = useState<string[]>(
    initialVenue?.amenities || ['WiFi', 'Projector', 'Sound System'],
  );
  const [customAmenity, setCustomAmenity] = useState('');
  const [photosText, setPhotosText] = useState<string>(
    initialVenue?.photos?.join('\n') ||
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  );
  const [instantBook, setInstantBook] = useState<boolean>(
    initialVenue?.instantBook ?? true,
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities((prev) => [...prev, trimmed]);
      setCustomAmenity('');
    }
  };

  const handleCityPreset = (preset: (typeof CITY_PRESETS)[number]) => {
    setCity(preset.city);
    setCountry(preset.country);
    setLat(String(preset.lat));
    setLng(String(preset.lng));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const photos = photosText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    const parsed = venueFormSchema.safeParse({
      title,
      description,
      address,
      city,
      country,
      lat: Number(lat),
      lng: Number(lng),
      capacity: Number(capacity),
      pricePerHourDollars: Number(priceDollars),
      amenities,
      photos,
      instantBook,
    });

    if (!parsed.success) {
      setErrors(extractFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: parsed.data.title,
        description: parsed.data.description,
        address: parsed.data.address,
        city: parsed.data.city,
        country: parsed.data.country,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        capacity: parsed.data.capacity,
        pricePerHour: dollarsToCents(parsed.data.pricePerHourDollars),
        amenities: parsed.data.amenities,
        photos: parsed.data.photos,
        instantBook: parsed.data.instantBook,
      });
    } catch (err: unknown) {
      setErrors({
        form: err instanceof Error ? err.message : 'Failed to save venue',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6"
    >
      {errors.form && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs font-medium text-rose-700 dark:text-rose-300">
          {errors.form}
        </div>
      )}

      {/* Title & Description */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Venue Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Glasshouse Loft — SoHo Skyline Terrace"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
          />
          {errors.title && (
            <p className="text-xs text-rose-600 mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the layout, acoustics, lighting, and ideal event types..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
          />
          {errors.description && (
            <p className="text-xs text-rose-600 mt-1">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Location & Quick City Coordinate Presets */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Location & Coordinates
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CITY_PRESETS.map((preset) => (
              <button
                key={preset.city}
                type="button"
                onClick={() => handleCityPreset(preset)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                📍 {preset.city}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="452 Broadway, Penthouse B"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
            {errors.address && (
              <p className="text-xs text-rose-600 mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
            {errors.city && (
              <p className="text-xs text-rose-600 mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
            {errors.country && (
              <p className="text-xs text-rose-600 mt-1">{errors.country}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Latitude (-90 to 90)
            </label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
            {errors.lat && (
              <p className="text-xs text-rose-600 mt-1">{errors.lat}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Longitude (-180 to 180)
            </label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
            {errors.lng && (
              <p className="text-xs text-rose-600 mt-1">{errors.lng}</p>
            )}
          </div>
        </div>
      </div>

      {/* Capacity & Hourly Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Maximum Guest Capacity
          </label>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
          />
          {errors.capacity && (
            <p className="text-xs text-rose-600 mt-1">{errors.capacity}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Hourly Rate (USD $ — stored as{' '}
            {dollarsToCents(Number(priceDollars) || 0)} cents)
          </label>
          <input
            type="number"
            min={1}
            step="0.01"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
          />
          {errors.pricePerHourDollars && (
            <p className="text-xs text-rose-600 mt-1">
              {errors.pricePerHourDollars}
            </p>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Amenities
        </label>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_AMENITIES.map((item) => {
            const active = amenities.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleAmenity(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {active ? `✓ ${item}` : `+ ${item}`}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 max-w-sm">
          <input
            type="text"
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            placeholder="Add custom amenity..."
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={addCustomAmenity}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* Photos (URLs) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
          Photo URLs (one URL per line)
        </label>
        <textarea
          rows={3}
          value={photosText}
          onChange={(e) => setPhotosText(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs font-mono"
        />
        {errors.photos && (
          <p className="text-xs text-rose-600 mt-1">{errors.photos}</p>
        )}
      </div>

      {/* Instant Book Toggle */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            ⚡ Enable Instant Book
          </p>
          <p className="text-xs text-slate-500">
            Automatically confirm reservations when time slots are open
          </p>
        </div>
        <input
          type="checkbox"
          checked={instantBook}
          onChange={(e) => setInstantBook(e.target.checked)}
          className="h-5 w-5 accent-indigo-600 rounded cursor-pointer"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
      >
        {submitting ? 'Saving Venue...' : submitLabel}
      </button>
    </form>
  );
}
