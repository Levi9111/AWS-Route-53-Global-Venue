'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { venuesApi } from '../api/venues';
import { Venue } from '../api/types';
import { dollarsToCents, formatCents } from '../api/client';
import { VenueCard } from '../components/VenueCard';
import { VenueMap } from '../components/VenueMap';
import { VenueGridSkeleton } from '../components/Skeletons';
import { DatePicker } from '../components/DatePicker';

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

const EVENT_USE_CASES = [
  {
    label: 'Board Offsite',
    capacity: '20',
    amenities: ['WiFi', 'Video Conferencing', 'Whiteboards'],
  },
  {
    label: 'Tech Summit',
    capacity: '150',
    amenities: ['WiFi', 'Projector', 'Sound System', 'Stage'],
  },
  {
    label: 'Product Launch',
    capacity: '80',
    amenities: ['WiFi', 'Sound System', 'Catering Kitchen'],
  },
  {
    label: 'Rooftop Gala',
    capacity: '100',
    amenities: ['Sound System', 'Rooftop Access', 'Catering Kitchen'],
  },
];

type ViewMode = 'bento' | 'split' | 'specs';
type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'capacity-desc';

export default function HomePage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('bento');
  const [sortBy, setSortBy] = useState<SortMode>('featured');
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);

  // Filter states
  const [city, setCity] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startHour, setStartHour] = useState<string>('10');
  const [endHour, setEndHour] = useState<string>('14');
  const [capacity, setCapacity] = useState<string>('');
  const [maxPriceDollars, setMaxPriceDollars] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

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

        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
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
        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        setApiLatencyMs(Math.max(1, Math.round(t1 - t0)));

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

  useEffect(() => {
    const syncSaved = () => {
      try {
        const raw = localStorage.getItem('vf_saved_venues');
        setSavedIds(raw ? JSON.parse(raw) : []);
      } catch {
        setSavedIds([]);
      }
    };
    syncSaved();
    window.addEventListener('vf-saved-change', syncSaved);
    return () => window.removeEventListener('vf-saved-change', syncSaved);
  }, []);

  const displayedVenues = useMemo(() => {
    const base = savedOnly
      ? venues.filter((v) => savedIds.includes(v._id))
      : venues;
    if (sortBy === 'price-asc') {
      return [...base].sort((a, b) => a.pricePerHour - b.pricePerHour);
    }
    if (sortBy === 'price-desc') {
      return [...base].sort((a, b) => b.pricePerHour - a.pricePerHour);
    }
    if (sortBy === 'capacity-desc') {
      return [...base].sort((a, b) => b.capacity - a.capacity);
    }
    return base;
  }, [venues, savedOnly, savedIds, sortBy]);

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

  const applyUseCase = (preset: (typeof EVENT_USE_CASES)[number]) => {
    setCapacity(preset.capacity);
    setSelectedAmenities(preset.amenities);
    setPage(1);
    setLoading(true);
    venuesApi
      .list({
        city: city.trim() || undefined,
        capacity: Number(preset.capacity),
        amenities: preset.amenities,
        page: 1,
        limit,
      })
      .then((res) => {
        setVenues(res.data || []);
        setTotal(res.total || 0);
        setSelectedVenue(res.data?.[0] || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const toggleCompare = (venueId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(venueId)) return prev.filter((id) => id !== venueId);
      if (prev.length >= 3) return [...prev.slice(1), venueId];
      return [...prev, venueId];
    });
  };

  const compareVenues = useMemo(
    () => venues.filter((v) => compareIds.includes(v._id)),
    [venues, compareIds],
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-16">
      {/* Editorial Luxury Hero Section */}
      <section className="relative border-b border-white/[0.06] bg-[#0c0c0e] py-16 sm:py-24 overflow-hidden">
        {/* Architectural Blueprint Grid + Subtle Ambient Gold Glow */}
        <div className="absolute inset-0 bg-blueprint-grid pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(circle 800px at 15% -10%, rgba(217, 174, 84, 0.11) 0%, transparent 75%), radial-gradient(circle 600px at 88% 20%, rgba(217, 174, 84, 0.05) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative animate-fade-up">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              {/* Pill with metallic rim light */}
              <div className="badge-floating inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#161619]/90 text-[#D9AE54] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9AE54] animate-pulse" />
                <span className="tracking-wide">Premier Architectural & Summit Venues Worldwide</span>
              </div>

              {/* High-contrast Display Serif Heading */}
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-100 tracking-tight leading-[1.06]">
                Reserve <span className="text-gold-gradient">extraordinary spaces</span> for landmark events.
              </h1>

              {/* Constrained line-length body text */}
              <p className="text-zinc-400 text-base sm:text-lg max-w-[58ch] font-normal leading-relaxed">
                Curated lofts, waterfront pavilions, auditoriums, and private estates.
                Real-time server-side availability verification with transparent integer pricing.
              </p>
            </div>

            {/* Live Multi-Region AWS Telemetry Card */}
            <div className="glass-luxury rounded-2xl p-4 sm:p-5 lg:w-72 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Global Edge Telemetry
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-[#09090b]/80 border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 font-mono">API RTT</p>
                  <p className="font-mono font-bold text-[#D9AE54] mt-0.5">
                    {apiLatencyMs !== null ? `${apiLatencyMs} ms` : '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#09090b]/80 border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 font-mono">ROUTING</p>
                  <p className="font-mono font-bold text-zinc-200 mt-0.5">Route 53</p>
                </div>
              </div>
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                CloudFront HTTPS → ALB Proxy → ECS Fargate (<span className="text-zinc-300">us-east-1</span> / <span className="text-zinc-300">eu-west-1</span>)
              </p>
            </div>
          </div>

          {/* Volumetric Filter Suite */}
          <form
            onSubmit={handleSearchSubmit}
            className="surface-resting rounded-3xl p-6 sm:p-7 space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Group A: Destination + Date */}
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
                  <DatePicker
                    label="Event Date (UTC)"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(newDate) => setDate(newDate)}
                    placeholder="Select date (UTC)..."
                  />
                </div>
              </div>

              {/* Group B: Capacity + Max Price */}
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

              {/* Group C: Action Buttons */}
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

            {/* Time window selection */}
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

            {/* Amenities Chips */}
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

          {/* Real-World Event Use Cases */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mr-1">
              Use Cases:
            </span>
            {EVENT_USE_CASES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyUseCase(preset)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#121215] hover:bg-[#1a1a1f] text-zinc-300 hover:text-[#D9AE54] border border-white/[0.07] hover:border-[#D9AE54]/40 transition-all cursor-pointer"
              >
                {preset.label} ({preset.capacity}+)
              </button>
            ))}
          </div>

          {/* Quick City Filters */}
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
          </div>
        </div>
      </section>

      {/* Main Catalog View: Multi-Mode Spatial Presentation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Spatial View Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.05]">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
              {city ? `Architectural Spaces in ${city}` : 'Global Architectural Venue Collection'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-wider">
              {displayedVenues.length} Spaces Cataloged • Multi-Region Availability
            </p>
          </div>

          {/* Controls: Saved Toggle + Sort + Perspective View Switcher */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSavedOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                savedOnly
                  ? 'bg-[#D9AE54]/20 text-[#D9AE54] border-[#D9AE54]/50'
                  : 'bg-[#111113] text-zinc-400 border-white/[0.08] hover:text-zinc-200'
              }`}
            >
              <span>{savedOnly ? '♥' : '♡'}</span>
              <span>Saved ({savedIds.length})</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              aria-label="Sort venues"
              className="px-3 py-2 rounded-2xl text-xs font-semibold bg-[#111113] text-zinc-200 border border-white/[0.08] focus:outline-none focus:border-[#D9AE54] cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="capacity-desc">Capacity: Largest</option>
            </select>

            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#111113] border border-white/[0.08] shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('bento')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'bento'
                  ? 'bg-[#18181b] text-[#D9AE54] shadow-xs border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🏛️ Editorial Bento</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-[#18181b] text-[#D9AE54] shadow-xs border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🗺️ Split Map Runway</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('specs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'specs'
                  ? 'bg-[#18181b] text-[#D9AE54] shadow-xs border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>📐 Specifications Matrix</span>
            </button>
          </div>
          </div>
        </div>

        {loading ? (
          <VenueGridSkeleton count={6} />
        ) : error ? (
          <div className="rounded-3xl border border-rose-900/40 bg-rose-950/20 p-10 text-center space-y-3 shadow-xs">
            <p className="text-base font-bold text-rose-400">Unable to load venues</p>
            <p className="text-xs text-rose-500 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => fetchVenues(page)}
              className="btn-volumetric-gold px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : displayedVenues.length === 0 ? (
          <div className="surface-resting rounded-3xl p-12 text-center space-y-3">
            <p className="text-base font-bold text-zinc-200">
              {savedOnly ? 'No saved venues in this view' : 'No venues match your current filters'}
            </p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {savedOnly
                ? 'Tap the heart icon on any venue card to shortlist spaces for your event.'
                : 'Try adjusting your capacity criteria, date slot, or explore all cities.'}
            </p>
            <button
              type="button"
              onClick={savedOnly ? () => setSavedOnly(false) : handleResetFilters}
              className="btn-volumetric-gold px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {savedOnly ? 'Show All Venues' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <>
            {/* ─────────────────────────────────────────────────────────────────
                PERSPECTIVE 1: EDITORIAL BENTO LAYOUT
                Lead card spans 2 columns with full blueprint narrative specs
               ───────────────────────────────────────────────────────────────── */}
            {viewMode === 'bento' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {displayedVenues.map((venue, idx) => (
                  <VenueCard
                    key={venue._id}
                    venue={venue}
                    variant={idx === 0 ? 'featured' : 'standard'}
                    isSelected={selectedVenue?._id === venue._id}
                    onSelect={setSelectedVenue}
                    isCompared={compareIds.includes(venue._id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                PERSPECTIVE 2: SPLIT MAP RUNWAY VIEW
                Left column: scrollable compact cards. Right column: sticky radar map.
               ───────────────────────────────────────────────────────────────── */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 space-y-3.5">
                  {displayedVenues.map((venue) => (
                    <VenueCard
                      key={venue._id}
                      venue={venue}
                      variant="compact"
                      isSelected={selectedVenue?._id === venue._id}
                      onSelect={setSelectedVenue}
                    />
                  ))}
                </div>

                <div className="lg:col-span-6 lg:sticky lg:top-24">
                  <VenueMap
                    venues={displayedVenues}
                    selectedVenue={selectedVenue}
                    onSelectVenue={setSelectedVenue}
                  />
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                PERSPECTIVE 3: ARCHITECTURAL SPECIFICATIONS MATRIX
                Direct comparison of acoustic treatment, ceiling heights, capacity,
                and instant reservation models.
               ───────────────────────────────────────────────────────────────── */}
            {viewMode === 'specs' && (
              <div className="surface-resting rounded-3xl overflow-hidden border border-white/[0.06]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#161619] text-zinc-400 uppercase tracking-widest border-b border-white/[0.06]">
                      <tr>
                        <th className="py-4 px-5">Venue & Style</th>
                        <th className="py-4 px-5">Location</th>
                        <th className="py-4 px-5">Max Guests</th>
                        <th className="py-4 px-5">Floor Scale</th>
                        <th className="py-4 px-5">Ceiling Height</th>
                        <th className="py-4 px-5">Rate</th>
                        <th className="py-4 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {displayedVenues.map((v) => (
                        <tr
                          key={v._id}
                          className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => setSelectedVenue(v)}
                        >
                          <td className="py-4 px-5">
                            <span className="font-serif font-bold text-sm text-zinc-100 block">
                              {v.title}
                            </span>
                            <span className="text-[10px] text-[#D9AE54] tracking-wider uppercase">
                              {v.instantBook ? '⚡ Instant Lock' : 'Concierge Approval'}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-zinc-300">
                            {v.city}, {v.country}
                          </td>
                          <td className="py-4 px-5 font-bold text-zinc-200">
                            {v.capacity}
                          </td>
                          <td className="py-4 px-5 text-zinc-400">
                            {v.capacity * 30} sq ft
                          </td>
                          <td className="py-4 px-5 text-zinc-400">
                            {v.capacity > 150 ? '22ft Heights' : '16ft Heights'}
                          </td>
                          <td className="py-4 px-5 font-extrabold text-[#D9AE54]">
                            ${((v.pricePerHour || 0) / 100).toFixed(0)}/hr
                          </td>
                          <td className="py-4 px-5 text-right">
                            <a
                              href={`/book/${v._id}`}
                              className="btn-volumetric-gold px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block"
                            >
                              Reserve
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                <span className="text-xs font-semibold text-zinc-500 font-mono">
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

      {/* Floating Compare Tray */}
      {compareVenues.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 glass-luxury rounded-full px-5 py-3 flex items-center gap-4 border border-[#D9AE54]/40">
          <span className="text-xs font-mono text-zinc-200">
            <strong className="text-[#D9AE54]">{compareVenues.length}</strong> / 3 spaces selected
          </span>
          <button
            type="button"
            onClick={() => setCompareModalOpen(true)}
            className="btn-volumetric-gold px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Compare Now
          </button>
          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {compareModalOpen && compareVenues.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setCompareModalOpen(false)}
        >
          <div
            className="surface-elevated rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 border border-white/10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-zinc-100">
                  Side-by-Side Venue Comparison
                </h3>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  Includes estimated 4-hour event subtotal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {compareVenues.map((v) => (
                <div key={v._id} className="p-4 rounded-2xl bg-[#09090b]/80 border border-white/[0.06] space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#D9AE54]">
                      {v.city}, {v.country}
                    </span>
                    <h4 className="font-serif text-lg font-bold text-zinc-100 leading-snug">
                      {v.title}
                    </h4>
                    <div className="pt-2 border-t border-white/[0.05] space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Hourly Rate</span>
                        <span className="font-bold text-zinc-100">{formatCents(v.pricePerHour)}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Est. 4-hr Event</span>
                        <span className="font-bold text-[#D9AE54]">{formatCents(v.pricePerHour * 4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Max Capacity</span>
                        <span className="font-semibold text-zinc-200">{v.capacity} guests</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Booking</span>
                        <span className="font-semibold text-zinc-200">{v.instantBook ? 'Instant Lock' : 'Concierge'}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/book/${v._id}`}
                    className="btn-volumetric-gold w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center block mt-3"
                  >
                    Reserve Space
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
