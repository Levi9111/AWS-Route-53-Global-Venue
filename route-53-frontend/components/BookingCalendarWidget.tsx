'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookedSlot, Venue } from '../api/types';
import { formatCents } from '../api/client';

interface BookingCalendarWidgetProps {
  venue: Venue;
  initialDate?: string;
  initialStartHour?: number;
  initialEndHour?: number;
  mode?: 'preview' | 'checkout';
  onConfirmSelection?: (selection: {
    startTimeIso: string;
    endTimeIso: string;
    durationHours: number;
    totalCents: number;
  }) => void;
  submitting?: boolean;
}

const HOURS = Array.from({ length: 15 }, (_, idx) => idx + 8); // 08:00 to 22:00 UTC

function getDefaultTomorrowDate(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function BookingCalendarWidget({
  venue,
  initialDate,
  initialStartHour = 10,
  initialEndHour = 14,
  mode = 'preview',
  onConfirmSelection,
  submitting = false,
}: BookingCalendarWidgetProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || getDefaultTomorrowDate(),
  );
  const [startHour, setStartHour] = useState<number>(initialStartHour);
  const [endHour, setEndHour] = useState<number>(initialEndHour);

  const bookedSlots: BookedSlot[] = useMemo(
    () => venue.bookedSlots || [],
    [venue.bookedSlots],
  );

  // Check if a given hour [hour, hour+1) on selectedDate overlaps any existing active booking
  const isHourBooked = (hour: number): boolean => {
    const slotStart = new Date(
      `${selectedDate}T${String(hour).padStart(2, '0')}:00:00.000Z`,
    );
    const slotEnd = new Date(
      `${selectedDate}T${String(hour + 1).padStart(2, '0')}:00:00.000Z`,
    );

    return bookedSlots.some((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < slotEnd && bEnd > slotStart;
    });
  };

  // Check if entire selected range [startHour, endHour) has any conflict
  const hasRangeConflict = useMemo(() => {
    if (endHour <= startHour) return true;
    for (let h = startHour; h < endHour; h++) {
      if (isHourBooked(h)) return true;
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, startHour, endHour, bookedSlots]);

  const durationHours = Math.max(0, endHour - startHour);
  const totalCents = durationHours * venue.pricePerHour;

  const startTimeIso = `${selectedDate}T${String(startHour).padStart(2, '0')}:00:00.000Z`;
  const endTimeIso = `${selectedDate}T${String(endHour).padStart(2, '0')}:00:00.000Z`;

  const handleHourClick = (hour: number) => {
    if (isHourBooked(hour)) return;
    if (hour < startHour || endHour > startHour + 1) {
      setStartHour(hour);
      setEndHour(Math.min(23, hour + 2));
    } else if (hour >= startHour) {
      setEndHour(Math.min(23, hour + 1));
    }
  };

  const handleProceed = () => {
    if (hasRangeConflict || durationHours <= 0) return;
    if (mode === 'checkout' && onConfirmSelection) {
      onConfirmSelection({
        startTimeIso,
        endTimeIso,
        durationHours,
        totalCents,
      });
    } else {
      const qs = new URLSearchParams({
        date: selectedDate,
        startHour: String(startHour),
        endHour: String(endHour),
      });
      router.push(`/book/${venue._id}?${qs.toString()}`);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md space-y-5">
      <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCents(venue.pricePerHour)}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {' '}
            / hour
          </span>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            venue.instantBook
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
          }`}
        >
          {venue.instantBook ? '⚡ Instant Confirmation' : '⏳ Host Approval'}
        </span>
      </div>

      {/* Date Picker */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Event Date (UTC)
        </label>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
      </div>

      {/* Start / End Hour Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Start Time (UTC)
          </label>
          <select
            value={startHour}
            onChange={(e) => {
              const nextStart = Number(e.target.value);
              setStartHour(nextStart);
              if (endHour <= nextStart) {
                setEndHour(nextStart + 1);
              }
            }}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {HOURS.map((h) => (
              <option key={h} value={h} disabled={isHourBooked(h)}>
                {String(h).padStart(2, '0')}:00 UTC{' '}
                {isHourBooked(h) ? '(Booked)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            End Time (UTC)
          </label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {HOURS.map((h) => h + 1)
              .filter((h) => h > startHour)
              .map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00 UTC
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Interactive Hourly Availability Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Hourly Availability Grid
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />{' '}
              Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/80 inline-block" />{' '}
              Booked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {HOURS.map((hour) => {
            const booked = isHourBooked(hour);
            const inRange = hour >= startHour && hour < endHour;
            return (
              <button
                key={hour}
                type="button"
                disabled={booked}
                onClick={() => handleHourClick(hour)}
                className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  booked
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 line-through cursor-not-allowed opacity-75'
                    : inRange
                      ? 'bg-indigo-600 text-white shadow-xs cursor-pointer'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer'
                }`}
              >
                {String(hour).padStart(2, '0')}:00
              </button>
            );
          })}
        </div>
      </div>

      {/* Conflict Alert */}
      {hasRangeConflict && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">
          ⚠️ The selected time range overlaps with an existing reservation.
          Please choose available hours.
        </div>
      )}

      {/* Price Breakdown in Cents -> Formatted Dollars */}
      {durationHours > 0 && !hasRangeConflict && (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 space-y-2 border border-slate-200/70 dark:border-slate-800">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              {formatCents(venue.pricePerHour)} × {durationHours}{' '}
              {durationHours === 1 ? 'hour' : 'hours'}
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {formatCents(totalCents, { includeDecimals: true })}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Platform & Multi-Region Protection</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Included ($0.00)
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Total ({totalCents.toLocaleString()} cents)
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {formatCents(totalCents, { includeDecimals: true })}
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={hasRangeConflict || durationHours <= 0 || submitting}
        onClick={handleProceed}
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {submitting
          ? 'Confirming Reservation...'
          : mode === 'checkout'
            ? `Confirm & Book (${formatCents(totalCents, { includeDecimals: true })})`
            : 'Continue to Booking'}
      </button>
    </div>
  );
}
