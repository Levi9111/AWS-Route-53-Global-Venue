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
      className={`group rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden flex flex-col ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-lg'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
      }`}
    >
      {/* Image Header */}
      <Link
        href={`/venues/${venue._id}`}
        className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainPhoto}
          alt={venue.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {venue.instantBook ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/95 text-white shadow-xs backdrop-blur-xs">
              ⚡ Instant Book
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
              Host Approval
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <span className="text-xs font-medium bg-slate-950/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
            📍 {venue.city}, {venue.country}
          </span>
          <span className="text-xs font-semibold bg-slate-950/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
            👥 Up to {venue.capacity}
          </span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link
            href={`/venues/${venue._id}`}
            className="block font-semibold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1"
          >
            {venue.title}
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {venue.description}
          </p>

          {venue.amenities && venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {venue.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {amenity}
                </span>
              ))}
              {venue.amenities.length > 4 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  +{venue.amenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCents(venue.pricePerHour)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {' '}
              / hour
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/venues/${venue._id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Details
            </Link>
            <Link
              href={`/book/${venue._id}`}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Book Space
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
