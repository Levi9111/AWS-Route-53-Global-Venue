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

function latLngToPercent(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return {
    x: Math.min(95, Math.max(5, x)),
    y: Math.min(90, Math.max(10, y)),
  };
}

export function VenueMap({
  venues,
  selectedVenue,
  onSelectVenue,
}: VenueMapProps) {
  const active = selectedVenue || venues[0] || null;

  return (
    <div className="relative w-full h-80 sm:h-[380px] rounded-3xl border border-zinc-800/80 bg-[#09090b] overflow-hidden shadow-2xl">
      {/* Precision architectural dark grid */}
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full object-cover opacity-20"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="map-grid-fine"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="1000" height="500" fill="url(#map-grid-fine)" />
        {/* Continents Silhouettes in understated muted graphite */}
        <path
          d="M120,80 L280,75 L310,160 L240,220 L180,210 L130,140 Z"
          fill="rgba(255, 255, 255, 0.06)"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1"
        />
        <path
          d="M260,250 L340,270 L320,420 L270,440 L250,330 Z"
          fill="rgba(255, 255, 255, 0.05)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />
        <path
          d="M450,75 L570,70 L585,155 L465,165 L440,120 Z"
          fill="rgba(255, 255, 255, 0.08)"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="1"
        />
        <path
          d="M455,180 L580,185 L595,350 L520,400 L450,280 Z"
          fill="rgba(255, 255, 255, 0.05)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />
        <path
          d="M590,75 L880,85 L900,240 L750,270 L610,190 Z"
          fill="rgba(255, 255, 255, 0.07)"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1"
        />
        <path
          d="M770,320 L890,325 L885,415 L775,405 Z"
          fill="rgba(255, 255, 255, 0.05)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />
      </svg>

      {/* Top Status Pill */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md text-zinc-300 px-3.5 py-1.5 rounded-full border border-zinc-800 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Live Multi-Region Venue Network ({venues.length} Spaces)</span>
      </div>

      {/* Map Pins */}
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
              isCurrent ? 'z-30 scale-110' : 'z-20 hover:scale-105'
            }`}
            title={`${venue.title} — ${venue.city}`}
          >
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 border whitespace-nowrap transition-colors ${
                isCurrent
                  ? 'bg-white text-zinc-950 border-white ring-4 ring-white/20'
                  : 'bg-zinc-900/90 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              <span>{formatCents(venue.pricePerHour)}</span>
              <span className="text-[10px] opacity-60">/h</span>
            </div>
          </button>
        );
      })}

      {/* Floating Selected Venue Card */}
      {active && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-84 z-30 bg-[#121215]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 text-white shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {active.city}, {active.country}
              </p>
              <h4 className="text-sm font-bold line-clamp-1">
                {active.title}
              </h4>
            </div>
            <span className="text-xs font-extrabold bg-zinc-800 text-zinc-100 px-2.5 py-1 rounded-lg shrink-0">
              {formatCents(active.pricePerHour)}/hr
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400">
              👥 Up to {active.capacity} guests
            </span>
            <Link
              href={`/venues/${active._id}`}
              className="font-bold text-white hover:text-zinc-300 transition-colors"
            >
              Inspect Space →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
