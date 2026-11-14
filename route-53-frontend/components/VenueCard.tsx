'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Venue } from '../api/types';
import { formatCents } from '../api/client';

interface VenueCardProps {
  venue: Venue;
  isSelected?: boolean;
  onSelect?: (venue: Venue) => void;
  variant?: 'standard' | 'featured' | 'compact';
}

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80';

// Deterministic architectural metadata badge based on venue capacity / title
function getArchitecturalPedigree(venue: Venue) {
  if (venue.title.toLowerCase().includes('glasshouse') || venue.title.toLowerCase().includes('loft')) {
    return {
      style: 'Bauhaus Glasshouse',
      sqft: '4,500 sq ft',
      ceiling: '18ft Ceilings',
      acoustics: 'Studio Tuned',
      region: 'AWS us-east-1',
    };
  }
  if (venue.title.toLowerCase().includes('foundry') || venue.title.toLowerCase().includes('vault')) {
    return {
      style: 'Victorian Industrial Vault',
      sqft: '6,200 sq ft',
      ceiling: '22ft Timber Atrium',
      acoustics: 'Laser 4K Audio',
      region: 'AWS eu-west-1',
    };
  }
  if (venue.title.toLowerCase().includes('pavilion') || venue.title.toLowerCase().includes('canal')) {
    return {
      style: 'Waterfront Glass Pavilion',
      sqft: '3,800 sq ft',
      ceiling: '16ft Panoramic Glazing',
      acoustics: 'Dolby Voice Certified',
      region: 'AWS eu-west-1',
    };
  }
  if (venue.title.toLowerCase().includes('amphitheater') || venue.title.toLowerCase().includes('shibuya')) {
    return {
      style: 'Skyline Auditorium',
      sqft: '7,400 sq ft',
      ceiling: '24ft Tiered Arena',
      acoustics: 'Dual LED Wall Array',
      region: 'AWS ap-northeast-1',
    };
  }
  return {
    style: 'Curated Architectural Venue',
    sqft: `${venue.capacity * 30} sq ft`,
    ceiling: '16ft Heights',
    acoustics: 'Acoustic Treated',
    region: 'AWS Multi-Region',
  };
}

export function VenueCard({
  venue,
  isSelected,
  onSelect,
  variant = 'standard',
}: VenueCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const photos = venue.photos && venue.photos.length > 0 ? venue.photos : [FALLBACK_PHOTO];
  const pedigree = getArchitecturalPedigree(venue);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vf_saved_venues');
      if (raw) {
        const list: string[] = JSON.parse(raw);
        setSaved(list.includes(venue._id));
      }
    } catch {
      // ignore storage errors
    }
  }, [venue._id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const raw = localStorage.getItem('vf_saved_venues');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = list.includes(venue._id)
        ? list.filter((id) => id !== venue._id)
        : [...list, venue._id];
      localStorage.setItem('vf_saved_venues', JSON.stringify(next));
      setSaved(next.includes(venue._id));
      window.dispatchEvent(new Event('vf-saved-change'));
    } catch {
      // ignore storage errors
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  /* ──────────────────────────────────────────────────────────────────────────
     FEATURED BENTO HERO CARD VARIANT (Spans 2 columns on desktop)
     ────────────────────────────────────────────────────────────────────────── */
  if (variant === 'featured') {
    return (
      <div
        onMouseEnter={() => onSelect?.(venue)}
        className={`group lg:col-span-2 rounded-3xl transition-all duration-400 flex flex-col md:flex-row p-3 relative overflow-hidden ${
          isSelected
            ? 'surface-elevated ring-1 ring-[#D9AE54]/70 -translate-y-1'
            : 'surface-resting hover:surface-elevated hover:-translate-y-1'
        }`}
      >
        {/* Media Plane with Hover Slide Carousel */}
        <div className="relative md:w-7/12 aspect-[16/11] md:aspect-auto md:min-h-[380px] rounded-2xl overflow-hidden bg-[#08080a] shadow-inner ring-1 ring-white/5 shrink-0">
          {/* Save / Bookmark Heart */}
          <button
            type="button"
            onClick={toggleSave}
            aria-label={saved ? 'Remove from saved venues' : 'Save venue'}
            className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer ${
              saved
                ? 'bg-[#D9AE54] text-[#0b0b0c] border-[#D9AE54] shadow-md scale-105'
                : 'bg-[#09090b]/80 text-zinc-300 border-white/15 hover:text-[#D9AE54] hover:border-[#D9AE54]/50'
            }`}
          >
            <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[photoIndex]}
            alt={venue.title}
            className="h-full w-full object-cover group-hover:scale-104 transition-transform duration-700 ease-out"
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 140% 100% at 15% 0%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          {/* Micro Carousel Indicators */}
          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-14 flex items-center justify-between z-20">
              <div className="flex gap-1">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === photoIndex ? 'w-6 bg-[#D9AE54]' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="w-6 h-6 rounded-full bg-black/60 hover:bg-black text-white text-[10px] flex items-center justify-center backdrop-blur-md"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="w-6 h-6 rounded-full bg-black/60 hover:bg-black text-white text-[10px] flex items-center justify-center backdrop-blur-md"
                >
                  ›
                </button>
              </div>
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 text-white">
            <span className="badge-floating inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#141417]/85 text-zinc-100 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9AE54]" />
              {pedigree.style}
            </span>
            <span className="badge-floating text-xs font-bold text-[#D9AE54] bg-[#141417]/85 px-3 py-1 rounded-full backdrop-blur-md">
              ★ {venue.averageRating || '5.0'} Verified
            </span>
          </div>
        </div>

        {/* Narrative & Specification Column */}
        <div className="md:w-5/12 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#09090b]/80 border border-[#D9AE54]/25 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider text-[#D9AE54] whitespace-nowrap w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9AE54]" />
              <span>FEATURED</span>
              <span className="text-zinc-600">•</span>
              <span>{pedigree.region}</span>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              <span className="truncate">📍 {venue.city}, {venue.country}</span>
              <span className="shrink-0 text-zinc-300">👥 {venue.capacity} guests</span>
            </div>

            <Link
              href={`/venues/${venue._id}`}
              className="block font-serif text-2xl font-extrabold text-zinc-100 group-hover:text-[#D9AE54] transition-colors leading-tight"
            >
              {venue.title}
            </Link>

            <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed font-normal">
              {venue.description}
            </p>

            {/* Architectural Telemetry Matrix */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <div className="p-2.5 rounded-xl bg-[#09090b]/80 border border-white/[0.04]">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Spatial Scale</p>
                <p className="text-xs font-semibold text-zinc-200 mt-0.5">{pedigree.sqft}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#09090b]/80 border border-white/[0.04]">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Vertical Height</p>
                <p className="text-xs font-semibold text-zinc-200 mt-0.5">{pedigree.ceiling}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#09090b]/80 border border-white/[0.04]">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Acoustic Spec</p>
                <p className="text-xs font-semibold text-zinc-200 mt-0.5 truncate">{pedigree.acoustics}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#09090b]/80 border border-white/[0.04]">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Booking Model</p>
                <p className="text-xs font-semibold text-[#D9AE54] mt-0.5">
                  {venue.instantBook ? 'Instant Lock' : 'Concierge'}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Action Line */}
          <div className="pt-4 border-t border-white/5 flex items-baseline justify-between gap-4">
            <div>
              <span className="text-2xl font-extrabold text-zinc-100 tracking-tight">
                {formatCents(venue.pricePerHour)}
              </span>
              <span className="text-xs text-zinc-500"> / hour</span>
            </div>

            <Link
              href={`/book/${venue._id}`}
              className="btn-volumetric-gold px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-block text-center"
            >
              Reserve Space
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────────────────
     COMPACT RUNWAY STRIP VARIANT (For Split Map View)
     ────────────────────────────────────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <div
        onMouseEnter={() => onSelect?.(venue)}
        className={`group rounded-2xl transition-all duration-300 flex items-center p-3 gap-4 ${
          isSelected
            ? 'surface-elevated ring-1 ring-[#D9AE54]/70 -translate-y-0.5'
            : 'surface-resting hover:surface-elevated hover:-translate-y-0.5'
        }`}
      >
        <div className="relative w-28 h-24 rounded-xl overflow-hidden bg-black shrink-0 ring-1 ring-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[0]}
            alt={venue.title}
            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase text-[#D9AE54] tracking-wider truncate">
              {venue.city} • {pedigree.style}
            </span>
            <span className="text-xs font-bold text-zinc-100 shrink-0">
              {formatCents(venue.pricePerHour)}/hr
            </span>
          </div>
          <Link
            href={`/venues/${venue._id}`}
            className="block font-serif font-bold text-sm text-zinc-100 group-hover:text-[#D9AE54] transition-colors truncate"
          >
            {venue.title}
          </Link>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span>👥 {venue.capacity} guests</span>
            <span>•</span>
            <span>{pedigree.sqft}</span>
          </div>
        </div>

        <Link
          href={`/book/${venue._id}`}
          className="btn-volumetric-gold px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0"
        >
          Book
        </Link>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────────────────
     STANDARD EDITORIAL CARD VARIANT (With Hover Micro-Carousel + Telemetry)
     ────────────────────────────────────────────────────────────────────────── */
  return (
    <div
      onMouseEnter={() => onSelect?.(venue)}
      className={`group rounded-3xl transition-all duration-300 flex flex-col p-2.5 ${
        isSelected
          ? 'surface-elevated -translate-y-1.5 ring-1 ring-[#D9AE54]/70'
          : 'surface-resting hover:surface-elevated hover:-translate-y-1.5'
      }`}
    >
      {/* Photo Plane - Sits slightly recessed with a distinct bevel gutter */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#08080a] shadow-inner ring-1 ring-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[photoIndex]}
          alt={venue.title}
          className="h-full w-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Angular Ambient Light Scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 130% 90% at 20% 0%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        {/* Save / Bookmark Heart */}
        <button
          type="button"
          onClick={toggleSave}
          aria-label={saved ? 'Remove from saved venues' : 'Save venue'}
          className={`absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer ${
            saved
              ? 'bg-[#D9AE54] text-[#0b0b0c] border-[#D9AE54] shadow-md scale-105'
              : 'bg-black/60 text-zinc-200 border-white/15 hover:text-[#D9AE54] hover:border-[#D9AE54]/50'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Floating Carousel Arrows and Dash Controls */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-3 right-12 flex items-center justify-between z-20">
            <div className="flex gap-1">
              {photos.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === photoIndex ? 'w-5 bg-[#D9AE54]' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={prevPhoto}
                className="w-5 h-5 rounded-full bg-black/60 hover:bg-black text-white text-[10px] flex items-center justify-center backdrop-blur-md"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                className="w-5 h-5 rounded-full bg-black/60 hover:bg-black text-white text-[10px] flex items-center justify-center backdrop-blur-md"
              >
                ›
              </button>
            </div>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 text-white">
          <span className="badge-floating inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#141417]/90 text-zinc-100 backdrop-blur-md">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                venue.instantBook ? 'bg-[#D9AE54]' : 'bg-zinc-400'
              }`}
            />
            {pedigree.style}
          </span>
          <span className="badge-floating text-[10px] font-mono text-zinc-300 bg-[#141417]/90 px-2 py-0.5 rounded-full backdrop-blur-md">
            {pedigree.sqft}
          </span>
        </div>
      </div>

      {/* Card Content Plane */}
      <div className="px-3.5 pt-4 pb-2 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>📍 {venue.city}, {venue.country}</span>
            <span>👥 {venue.capacity} guests</span>
          </div>

          <Link
            href={`/venues/${venue._id}`}
            className="block font-serif font-bold text-base text-zinc-100 group-hover:text-[#D9AE54] transition-colors line-clamp-1"
          >
            {venue.title}
          </Link>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
            {venue.description}
          </p>

          {/* Architectural Telemetry Ribbon */}
          <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-zinc-400">
            <span className="px-2 py-0.5 rounded-md bg-[#161619] border border-white/5">
              🏛️ {pedigree.ceiling}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#161619] border border-white/5 truncate">
              🔊 {pedigree.acoustics}
            </span>
          </div>
        </div>

        {/* Footer Pricing & Volumetric Button */}
        <div className="pt-3.5 border-t border-white/5 flex items-baseline justify-between gap-2">
          <div>
            <span className="text-lg font-extrabold text-zinc-100 tracking-tight">
              {formatCents(venue.pricePerHour)}
            </span>
            <span className="text-xs text-zinc-500"> / hr</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/venues/${venue._id}`}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white border border-white/5 hover:bg-white/[0.04] transition-colors"
            >
              Specs
            </Link>
            <Link
              href={`/book/${venue._id}`}
              className="btn-volumetric-gold px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-block"
            >
              Reserve
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
