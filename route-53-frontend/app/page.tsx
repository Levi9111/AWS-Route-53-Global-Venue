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
    <div className="space-y-16">
      {/* Editorial Luxury Hero Section */}
      <section className="relative border-b border-white/[0.06] bg-[#0c0c0e] py-16 sm:py-24">
        {/* Subtle Ambient Light Source from Top-Left */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              'radial-gradient(circle 800px at 15% -10%, rgba(217, 174, 84, 0.08) 0%, transparent 80%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative">
          <div className="max-w-3xl space-y-4">
            {/* Pill with metallic rim light */}
            <div className="badge-floating inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#161619] text-[#D9AE54]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9AE54] animate-pulse" />
              <span className="tracking-wide">Premier Architectural & Summit Venues Worldwide</span>
            </div>

            {/* High-contrast Display Serif Heading */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-100 tracking-tight leading-[1.08]">
              Reserve extraordinary spaces for landmark events.
            </h1>

            {/* Constrained line-length body text */}
            <p className="text-zinc-400 text-base sm:text-lg max-w-[58ch] font-normal leading-relaxed">
              Curated lofts, waterfront pavilions, auditoriums, and private estates.
              Real-time server-side availability verification with transparent integer pricing.
            </p>
          </div>

          {/* Level 1 Resting Surface: Volumetric Filter Suite */}
          <form
            onSubmit={handleSearchSubmit}
            className="surface-resting rounded-3xl p-6 sm:p-7 space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Group A: Destination + Date (Carved-in channel inputs) */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-[#09090b]/80 border border-white/[0.03]">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Destination City
                  </label>
                  <input
                    type="text"
                    placeholder="New York, London, Tokyo..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="recessed-channel w-full rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Event Date (UTC)
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDate(e.target.value)}
                    className="recessed-channel w-full rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Group B: Capacity + Max Price (Carved-in channels) */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-[#09090b]/80 border border-white/[0.03]">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Min Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="recessed-channel w-full rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Max $/hr
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="$1000"
                    value={maxPriceDollars}
                    onChange={(e) => setMaxPriceDollars(e.target.value)}
                    className="recessed-channel w-full rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Group C: Volumetric Button CTA */}
              <div className="lg:col-span-2 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                <button
                  type="submit"
                  className="btn-volumetric-gold w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Time window selection when date selected */}
            {date && (
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.04] text-xs">
                <span className="font-semibold text-zinc-400">
                  Target Slot Window on {date} (UTC):
                </span>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="recessed-channel rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={h} className="bg-[#111113]">
                      {String(h).padStart(2, '0')}:00 UTC
                    </option>
                  ))}
                </select>
                <span className="text-zinc-500">to</span>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="recessed-channel rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 9).map((h) => (
                    <option key={h} value={h} className="bg-[#111113]">
                      {String(h).padStart(2, '0')}:00 UTC
                    </option>
                  ))}
                </select>
                <span className="text-emerald-400 font-medium">
                  ✓ Excludes venues booked during this slot
                </span>
              </div>
            )}

            {/* Matte Amenity Chips sitting directly on the surface */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.04]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mr-1">
                Equipment:
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
                        ? 'bg-[#D9AE54] text-[#0b0b0c] font-bold shadow-sm'
                        : 'bg-[#18181b]/70 text-zinc-300 hover:bg-[#202025] border border-white/[0.04]'
                    }`}
                  >
                    {active ? `✓ ${amenity}` : `+ ${amenity}`}
                  </button>
                );
              })}
            </div>
          </form>

          {/* Differentiated City Quick-Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-white/[0.06] pb-3">
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
                        ? 'border-[#D9AE54] text-[#D9AE54]'
                        : 'border-transparent text-zinc-500 hover:text-zinc-200'
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
              className="text-xs font-semibold px-4 py-1.5 rounded-full border border-white/10 text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {showMap ? 'Hide Radar Map' : 'Show Radar Map'}
            </button>
          </div>
        </div>
      </section>

      {/* Main Catalog View with Smooth Transitional Spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
        {showMap && !loading && venues.length > 0 && (
          <VenueMap
            venues={venues}
            selectedVenue={selectedVenue}
            onSelectVenue={setSelectedVenue}
          />
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              {city ? `Event Spaces in ${city}` : 'Global Architectural Venue Collection'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Showing {venues.length} of {total} verified spaces
            </p>
          </div>
        </div>

        {loading ? (
          <VenueGridSkeleton count={6} />
        ) : error ? (
          <div className="rounded-3xl border border-rose-900/40 bg-rose-950/20 p-10 text-center space-y-3 shadow-xs">
            <p className="text-base font-bold text-rose-400">
              Unable to load venues
            </p>
            <p className="text-xs text-rose-500 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => fetchVenues(page)}
              className="btn-volumetric-gold px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : venues.length === 0 ? (
          <div className="surface-resting rounded-3xl p-12 text-center space-y-3">
            <p className="text-base font-bold text-zinc-200">
              No venues match your current filters
            </p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Try adjusting your capacity criteria, date slot, or explore all cities.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-volumetric-gold px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  className="px-4 py-2 rounded-full border border-white/10 text-xs font-medium disabled:opacity-30 hover:bg-white/[0.04] cursor-pointer disabled:cursor-not-allowed text-zinc-400"
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
                  className="px-4 py-2 rounded-full border border-white/10 text-xs font-medium disabled:opacity-30 hover:bg-white/[0.04] cursor-pointer disabled:cursor-not-allowed text-zinc-400"
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
