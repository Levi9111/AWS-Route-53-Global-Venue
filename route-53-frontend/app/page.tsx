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
            : 'Unable to connect to the venue API.',
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
    <div className="space-y-14">
      {/* Editorial Luxury Hero Section */}
      <section className="relative border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-[#0c0c0e]/70 py-16 sm:py-24 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-4">
            {/* Pill with warm bronze metallic accent */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FEF3C7] dark:bg-[#78350F]/40 text-[#92400E] dark:text-[#FDE68A] border border-[#FDE68A] dark:border-[#B45309]/50 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] dark:bg-[#FBBF24] animate-pulse" />
              <span className="tracking-wide">Premier Architectural & Summit Venues Worldwide</span>
            </div>

            {/* High-contrast Display Serif Heading */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-[1.08] sm:leading-[1.06]">
              Reserve extraordinary spaces for landmark events.
            </h1>

            {/* Constrained line-length body text */}
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-[58ch] font-normal leading-relaxed">
              Curated lofts, waterfront pavilions, auditoriums, and private estates.
              Real-time server-side availability verification with transparent integer pricing.
            </p>
          </div>

          {/* Grouped, Visual Filter Suite */}
          <form
            onSubmit={handleSearchSubmit}
            className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-xl space-y-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Group A: Destination + Date (6 cols) */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/60">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Destination City
                  </label>
                  <input
                    type="text"
                    placeholder="New York, London, Tokyo..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B45309] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Event Date (UTC)
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B45309] transition-all"
                  />
                </div>
              </div>

              {/* Group B: Capacity + Price Range (4 cols) */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-3 p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/60">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Min Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B45309] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Max $/hr
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="$1000"
                    value={maxPriceDollars}
                    onChange={(e) => setMaxPriceDollars(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B45309] transition-all"
                  />
                </div>
              </div>

              {/* Group C: Action Buttons (2 cols) */}
              <div className="lg:col-span-2 flex flex-col sm:flex-row lg:flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#B45309] hover:bg-[#92400E] active:scale-98 text-white font-bold text-xs uppercase tracking-wider shadow-sm shadow-[#B45309]/30 transition-all cursor-pointer"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Time window selection when date selected */}
            {date && (
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Slot Window on {date} (UTC):
                </span>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00 UTC
                    </option>
                  ))}
                </select>
                <span className="text-zinc-400">to</span>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 9).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00 UTC
                    </option>
                  ))}
                </select>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Excludes venues booked during this slot
                </span>
              </div>
            )}

            {/* Differentiated Amenity Filter Chips (with distinct padding & high-contrast active state) */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
                Equipment & Amenities:
              </span>
              {POPULAR_AMENITIES.map((amenity) => {
                const active = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-[#B45309] text-white font-bold shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-transparent'
                    }`}
                  >
                    {active ? `✓ ${amenity}` : `+ ${amenity}`}
                  </button>
                );
              })}
            </div>
          </form>

          {/* Differentiated City Quick-Filters: Underlined / Segmented Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
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
                        .list({ city: nextCity || undefined, page: 1, limit })
                        .then((res) => {
                          setVenues(res.data || []);
                          setTotal(res.total || 0);
                          setSelectedVenue(res.data?.[0] || null);
                        })
                        .catch(() => {});
                    }}
                    className={`pb-2 px-3 text-xs font-semibold transition-all cursor-pointer border-b-2 ${
                      isActive
                        ? 'border-[#B45309] text-[#B45309] dark:text-[#FBBF24] dark:border-[#FBBF24]'
                        : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
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
              className="text-xs font-semibold px-4 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {showMap ? 'Hide Map Radar' : 'Show Map Radar'}
            </button>
          </div>
        </div>
      </section>

      {/* Main Catalog View with Smooth Transitional Spacing */}
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
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              {city ? `Event Spaces in ${city}` : 'Global Architectural Venue Collection'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Showing {venues.length} of {total} verified spaces
            </p>
          </div>
        </div>

        {loading ? (
          <VenueGridSkeleton count={6} />
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-10 text-center space-y-3 shadow-xs">
            <p className="text-base font-bold text-rose-700 dark:text-rose-400">
              Unable to load venues
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => fetchVenues(page)}
              className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Retry Connection
            </button>
          </div>
        ) : venues.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-12 text-center space-y-3">
            <p className="text-base font-bold text-zinc-900 dark:text-white">
              No venues match your current filters
            </p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Try adjusting your capacity criteria, date slot, or explore all cities.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 text-white text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
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
              <div className="flex items-center justify-center gap-3 pt-8">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-medium disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-xs font-semibold text-zinc-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-medium disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
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
