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
    <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-xl space-y-6">
      {/* Rate header */}
      <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {formatCents(venue.pricePerHour)}
          </span>
          <span className="text-sm font-medium text-zinc-400"> / hour</span>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border ${
            venue.instantBook
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
          }`}
        >
          {venue.instantBook ? '⚡ Instant Book' : '⏳ Host Approval'}
        </span>
      </div>

      {/* Date Input */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
          Select Event Date (UTC)
        </label>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
        />
      </div>

      {/* Start and End selects */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            Start Time
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
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
          >
            {HOURS.map((h) => (
              <option key={h} value={h} disabled={isHourBooked(h)}>
                {String(h).padStart(2, '0')}:00 UTC {isHourBooked(h) ? '(Booked)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            End Time
          </label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
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

      {/* Hourly Timeline Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span className="font-bold uppercase tracking-wider">Hourly Availability</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white" /> Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Booked
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
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  booked
                    ? 'bg-rose-50 text-rose-400 dark:bg-rose-950/40 dark:text-rose-500 line-through cursor-not-allowed opacity-60'
                    : inRange
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {String(hour).padStart(2, '0')}:00
              </button>
            );
          })}
        </div>
      </div>

      {/* Conflict notice */}
      {hasRangeConflict && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-400">
          Selected window overlaps an active booking. Please select unreserved hours.
        </div>
      )}

      {/* Price breakdown */}
      {durationHours > 0 && !hasRangeConflict && (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/70 p-4 space-y-2.5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>
              {formatCents(venue.pricePerHour)} × {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {formatCents(totalCents, { includeDecimals: true })}
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex justify-between items-baseline">
            <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Total Amount
            </span>
            <span className="text-xl font-extrabold text-zinc-900 dark:text-white">
              {formatCents(totalCents, { includeDecimals: true })}
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={hasRangeConflict || durationHours <= 0 || submitting}
        onClick={handleProceed}
        className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-950 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        {submitting
          ? 'Confirming Slot...'
          : mode === 'checkout'
            ? `Confirm Reservation (${formatCents(totalCents, { includeDecimals: true })})`
            : 'Proceed to Reservation'}
      </button>
    </div>
  );
}
