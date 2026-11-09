'use client';

import React from 'react';
import Link from 'next/link';
import { Venue } from '../api/types';
import { formatCents } from '../api/client';

interface VenueMapProps {
  venues: Venue[];
  selectedVenue?: Venue | null;
  onSelectVenue?: (venue: Venue | null) => void;
}

/**
 * Converts latitude (-90..90) and longitude (-180..180) to normalized percentage coordinates
 * on an equirectangular world map projection.
 */
function latLngToPercent(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return {
    x: Math.min(95, Math.max(5, x)),
    y: Math.min(92, Math.max(8, y)),
  };
}

export function VenueMap({
  venues,
  selectedVenue,
  onSelectVenue,
}: VenueMapProps) {
  const active = selectedVenue || venues[0] || null;

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 overflow-hidden shadow-inner">
      {/* Subtle stylized world grid & continents backdrop */}
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full object-cover opacity-35"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="map-grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1000" height="500" fill="url(#map-grid)" />
        {/* Stylized continental silhouettes for visual orientation */}
        {/* North America */}
        <path
          d="M120,80 L280,75 L310,160 L240,220 L180,210 L130,140 Z"
          fill="rgba(99, 102, 241, 0.22)"
          stroke="rgba(129, 140, 248, 0.4)"
          strokeWidth="1.5"
        />
        {/* South America */}
        <path
          d="M260,250 L340,270 L320,420 L270,440 L250,330 Z"
          fill="rgba(99, 102, 241, 0.18)"
          stroke="rgba(129, 140, 248, 0.35)"
          strokeWidth="1.5"
        />
        {/* Europe */}
        <path
          d="M450,75 L570,70 L585,155 L465,165 L440,120 Z"
          fill="rgba(99, 102, 241, 0.25)"
          stroke="rgba(129, 140, 248, 0.45)"
          strokeWidth="1.5"
        />
        {/* Africa */}
        <path
          d="M455,180 L580,185 L595,350 L520,400 L450,280 Z"
          fill="rgba(99, 102, 241, 0.18)"
          stroke="rgba(129, 140, 248, 0.35)"
          strokeWidth="1.5"
        />
        {/* Asia */}
        <path
          d="M590,75 L880,85 L900,240 L750,270 L610,190 Z"
          fill="rgba(99, 102, 241, 0.22)"
          stroke="rgba(129, 140, 248, 0.4)"
          strokeWidth="1.5"
        />
        {/* Australia */}
        <path
          d="M770,320 L890,325 L885,415 L775,405 Z"
          fill="rgba(99, 102, 241, 0.18)"
          stroke="rgba(129, 140, 248, 0.35)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Top badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>
          Interactive Global Venue Map ({venues.length}{' '}
          {venues.length === 1 ? 'space' : 'spaces'} plotted)
        </span>
      </div>

      {/* Plotted Venue Markers */}
      {venues.map((venue) => {
        const pos = latLngToPercent(venue.lat || 40.7, venue.lng || -74.0);
        const isCurrent = active?._id === venue._id;

        return (
          <button
            key={venue._id}
            type="button"
            onClick={() => onSelectVenue?.(venue)}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer ${
              isCurrent ? 'z-30 scale-110' : 'z-20 hover:scale-110'
            }`}
            title={`${venue.title} — ${venue.city}`}
          >
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 border whitespace-nowrap ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-white ring-4 ring-indigo-500/40'
                  : 'bg-white text-slate-900 border-slate-300 hover:bg-indigo-50'
              }`}
            >
              <span>{formatCents(venue.pricePerHour)}</span>
              <span className="text-[10px] opacity-80">/h</span>
            </div>
          </button>
        );
      })}

      {/* Selected Venue Floating Card */}
      {active && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-30 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 text-white shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-indigo-400">
                📍 {active.city}, {active.country}
              </p>
              <h4 className="text-sm font-bold line-clamp-1 mt-0.5">
                {active.title}
              </h4>
            </div>
            <span className="text-xs font-bold bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded-md whitespace-nowrap">
              {formatCents(active.pricePerHour)}/hr
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
            <span>
              👥 {active.capacity} guests •{' '}
              {active.lat.toFixed(2)}°, {active.lng.toFixed(2)}°
            </span>
            <Link
              href={`/venues/${active._id}`}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
            >
              View Space →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
