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
      className={`group rounded-2xl border transition-all duration-300 bg-white dark:bg-[#121215] overflow-hidden flex flex-col ${
        isSelected
          ? 'border-zinc-900 dark:border-white shadow-xl -translate-y-0.5'
          : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Visual Image Header */}
      <Link
        href={`/venues/${venue._id}`}
        className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainPhoto}
          alt={venue.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 dark:bg-black/80 text-zinc-900 dark:text-white backdrop-blur-md shadow-xs">
            {venue.instantBook ? '⚡ Instant' : '⏳ On Request'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md">
            👥 {venue.capacity}
          </span>
        </div>

        {/* Location bar at bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <span className="text-xs font-medium tracking-tight drop-shadow-sm flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {venue.city}, {venue.country}
          </span>
          {venue.averageRating !== undefined && venue.averageRating > 0 && (
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1 drop-shadow-sm">
              ★ {venue.averageRating}
            </span>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link
            href={`/venues/${venue._id}`}
            className="block font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-1"
          >
            {venue.title}
          </Link>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-normal">
            {venue.description}
          </p>

          {/* Amenities Chips */}
          {venue.amenities && venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {venue.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {amenity}
                </span>
              ))}
              {venue.amenities.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-zinc-400">
                  +{venue.amenities.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Pricing & CTA */}
        <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-baseline justify-between gap-2">
          <div>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {formatCents(venue.pricePerHour)}
            </span>
            <span className="text-xs text-zinc-400"> / hr</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/book/${venue._id}`}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 shadow-xs transition-colors"
            >
              Reserve
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
