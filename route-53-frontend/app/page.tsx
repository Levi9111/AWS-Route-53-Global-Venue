'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { venuesApi } from '../api/venues';
import { Venue } from '../api/types';
import { dollarsToCents } from '../api/client';
import { VenueCard } from '../components/VenueCard';
import { VenueMap } from '../components/VenueMap';
import { VenueGridSkeleton } from '../components/Skeletons';

const POPULAR_AMENITIES = [
  'WiFi',
  'Projector',
  'Sound System',
  'Catering Kitchen',
  'Stage',
  'Rooftop Access',
  'Whiteboards',
  'Video Conferencing',
];

const QUICK_CITIES = [
  'All Cities',
  'New York',
  'London',
  'Dublin',
  'San Francisco',
  'Berlin',
  'Tokyo',
];

export default function HomePage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [city, setCity] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startHour, setStartHour] = useState<string>('10');
  const [endHour, setEndHour] = useState<string>('14');
  const [capacity, setCapacity] = useState<string>('');
  const [minPriceDollars, setMinPriceDollars] = useState<string>('');
  const [maxPriceDollars, setMaxPriceDollars] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showMap, setShowMap] = useState<boolean>(true);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(6);
  const [total, setTotal] = useState<number>(0);

  const fetchVenues = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      setError(null);
      try {
        let startDateIso: string | undefined;
        let endDateIso: string | undefined;

        if (date) {
          const sH = String(Number(startHour) || 10).padStart(2, '0');
          const eH = String(Number(endHour) || 14).padStart(2, '0');
          startDateIso = `${date}T${sH}:00:00.000Z`;
          endDateIso = `${date}T${eH}:00:00.000Z`;
        }

        const res = await venuesApi.list({
          city: city.trim() || undefined,
          startDate: startDateIso,
          endDate: endDateIso,
          capacity: capacity ? Number(capacity) : undefined,
          minPrice: minPriceDollars
            ? dollarsToCents(Number(minPriceDollars))
            : undefined,
          maxPrice: maxPriceDollars
            ? dollarsToCents(Number(maxPriceDollars))
            : undefined,
          amenities:
            selectedAmenities.length > 0 ? selectedAmenities : undefined,
          page: targetPage,
          limit,
        });

        setVenues(res.data || []);
        setTotal(res.total || 0);
        setPage(res.page || targetPage);
        if (res.data && res.data.length > 0) {
          setSelectedVenue(res.data[0]);
        } else {
          setSelectedVenue(null);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load venues right now.',
        );
      } finally {
        setLoading(false);
      }
    },
    [
      city,
      date,
      startHour,
      endHour,
      capacity,
      minPriceDollars,
      maxPriceDollars,
      selectedAmenities,
      page,
      limit,
    ],
  );

  useEffect(() => {
    fetchVenues(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVenues(1);
  };

  const handleResetFilters = () => {
    setCity('');
    setDate('');
    setCapacity('');
    setMinPriceDollars('');
    setMaxPriceDollars('');
    setSelectedAmenities([]);
    setPage(1);
    setTimeout(() => {
      venuesApi
        .list({ page: 1, limit })
        .then((res) => {
          setVenues(res.data || []);
          setTotal(res.total || 0);
          setSelectedVenue(res.data?.[0] || null);
        })
        .catch(() => {});
    }, 0);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-8">
      {/* Hero & Search Filter Bar */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              🌍 Global Event Space Marketplace • US-East & EU-West Ready
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Book extraordinary spaces for your next landmark event.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Real-time availability verification, transparent hourly pricing,
              and curated architectural venues across global hubs.
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* City */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  City or Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. New York, London, Dublin"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Date Availability */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Available Date (UTC)
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Minimum Capacity */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Min Capacity (Guests)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Price Range ($/hr) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Min $/hr
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="$0"
                    value={minPriceDollars}
                    onChange={(e) => setMinPriceDollars(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Max $/hr
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="$1000"
                    value={maxPriceDollars}
                    onChange={(e) => setMaxPriceDollars(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Search Action */}
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  Search Venues
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Optional Time Range when Date is selected */}
            {date && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Time Window on {date} (UTC):
                </span>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00 UTC
                    </option>
                  ))}
                </select>
                <span>to</span>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 9).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00 UTC
                    </option>
                  ))}
                </select>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  ✓ Filters out spaces already reserved during this slot
                </span>
              </div>
            )}

            {/* Amenities Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                Amenities:
              </span>
              {POPULAR_AMENITIES.map((amenity) => {
                const active = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {active ? `✓ ${amenity}` : amenity}
                  </button>
                );
              })}
            </div>
          </form>

          {/* Quick City Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_CITIES.map((c) => {
                const isAll = c === 'All Cities';
                const isActive = isAll ? city === '' : city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const nextCity = isAll ? '' : c;
                      setCity(nextCity);
                      setPage(1);
                      venuesApi
                        .list({
                          city: nextCity || undefined,
                          page: 1,
                          limit,
                        })
                        .then((res) => {
                          setVenues(res.data || []);
                          setTotal(res.total || 0);
                          setSelectedVenue(res.data?.[0] || null);
                        })
                        .catch(() => {});
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 cursor-pointer"
            >
              {showMap ? '🗺️ Hide Interactive Map' : '🗺️ Show Interactive Map'}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area: Interactive Map + Paginated Venue Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {showMap && !loading && venues.length > 0 && (
          <VenueMap
            venues={venues}
            selectedVenue={selectedVenue}
            onSelectVenue={setSelectedVenue}
          />
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {city ? `Event Spaces in ${city}` : 'Featured Global Event Spaces'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {venues.length} of {total} available spaces
            </p>
          </div>
        </div>

        {loading ? (
          <VenueGridSkeleton count={6} />
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-8 text-center space-y-3">
            <p className="text-base font-semibold text-rose-700 dark:text-rose-300">
              Failed to load venues
            </p>
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            <button
              type="button"
              onClick={() => fetchVenues(page)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : venues.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              No venues match your exact filters
            </p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Try clearing your date range, adjusting price limits, or exploring
              all global cities.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <VenueCard
                  key={venue._id}
                  venue={venue}
                  isSelected={selectedVenue?._id === venue._id}
                  onSelect={setSelectedVenue}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
