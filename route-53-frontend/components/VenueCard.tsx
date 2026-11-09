'use client';

import React from 'react';
import Link from 'next/link';
import { Venue } from '../api/types';
import { formatCents } from '../api/client';

interface VenueCardProps {
  venue: Venue;
  isSelected?: boolean;
  onSelect?: (venue: Venue) => void;
}

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80';

export function VenueCard({ venue, isSelected, onSelect }: VenueCardProps) {
  const mainPhoto = venue.photos?.[0] || FALLBACK_PHOTO;

  return (
    <div
      onMouseEnter={() => onSelect?.(venue)}
      className={`group rounded-3xl transition-all duration-300 flex flex-col p-2.5 ${
        isSelected
          ? 'surface-elevated -translate-y-1.5 ring-1 ring-[#D9AE54]/60'
          : 'surface-resting hover:surface-elevated hover:-translate-y-1.5'
      }`}
    >
      {/* Photo Plane - Sits slightly recessed with a distinct bevel gutter */}
      <Link
        href={`/venues/${venue._id}`}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#08080a] block shadow-inner ring-1 ring-white/5"
      >
        {/* Parallax dolly camera trick: image scales while card translates */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainPhoto}
          alt={venue.title}
          className="h-full w-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Angular Ambient Light Scrim (simulates top-left light falloff instead of a flat dark band) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 130% 90% at 20% 0%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        {/* Floating Badges with their own distinct elevation shadows */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="badge-floating inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#141417]/85 text-zinc-100 backdrop-blur-md">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                venue.instantBook ? 'bg-[#D9AE54]' : 'bg-zinc-400'
              }`}
            />
            {venue.instantBook ? 'Instant Book' : 'On Request'}
          </span>
          <span className="badge-floating inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#141417]/85 text-zinc-200 backdrop-blur-md">
            👥 {venue.capacity}
          </span>
        </div>

        {/* Location & Rating on bottom edge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <span className="text-xs font-medium tracking-tight drop-shadow-md flex items-center gap-1 text-zinc-200">
            <svg
              className="w-3.5 h-3.5 text-[#D9AE54]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {venue.city}, {venue.country}
          </span>
          {venue.averageRating !== undefined && venue.averageRating > 0 && (
            <span className="text-xs font-bold text-[#D9AE54] flex items-center gap-1 drop-shadow-md">
              ★ {venue.averageRating}
            </span>
          )}
        </div>
      </Link>

      {/* Card Content Plane */}
      <div className="px-3.5 pt-4 pb-2 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link
            href={`/venues/${venue._id}`}
            className="block font-serif font-bold text-base text-zinc-100 group-hover:text-[#D9AE54] transition-colors line-clamp-1"
          >
            {venue.title}
          </Link>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
            {venue.description}
          </p>

          {/* Amenities Chips - Resting matte material */}
          {venue.amenities && venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {venue.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-[#1a1a1e] text-zinc-300 border border-white/5"
                >
                  {amenity}
                </span>
              ))}
              {venue.amenities.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-zinc-500">
                  +{venue.amenities.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Pricing & Volumetric Button */}
        <div className="pt-3.5 border-t border-white/5 flex items-baseline justify-between gap-2">
          <div>
            <span className="text-lg font-extrabold text-zinc-100 tracking-tight">
              {formatCents(venue.pricePerHour)}
            </span>
            <span className="text-xs text-zinc-500"> / hr</span>
          </div>

          <Link
            href={`/book/${venue._id}`}
            className="btn-volumetric-gold px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-block"
          >
            Reserve
          </Link>
        </div>
      </div>
    </div>
  );
}
