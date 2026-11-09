'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookedSlot, Venue } from '../api/types';
import { formatCents } from '../api/client';
import { DatePicker } from './DatePicker';

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
    <div className="surface-resting rounded-3xl p-6 space-y-6">
      {/* Rate header */}
      <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-5">
        <div>
          <span className="font-serif text-3xl font-bold text-zinc-100 tracking-tight">
            {formatCents(venue.pricePerHour)}
          </span>
          <span className="text-xs font-mono text-zinc-400"> / hour</span>
        </div>
        <span
          className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
            venue.instantBook
              ? 'bg-[#D9AE54]/15 text-[#D9AE54] border-[#D9AE54]/30'
              : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60'
          }`}
        >
          {venue.instantBook ? '⚡ Instant Book' : '⏳ Host Approval'}
        </span>
      </div>

      {/* Date Input with Custom Luxury Architectural Popover */}
      <div>
        <DatePicker
          label="Select Event Date (UTC)"
          value={selectedDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(newDate) => {
            if (newDate) setSelectedDate(newDate);
          }}
          clearable={false}
          placeholder="Select reservation date..."
        />
      </div>

      {/* Start and End selects */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
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
            className="w-full rounded-xl recessed-channel px-3 py-2.5 text-xs font-mono font-semibold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#D9AE54]"
          >
            {HOURS.map((h) => (
              <option key={h} value={h} disabled={isHourBooked(h)} className="bg-[#121215]">
                {String(h).padStart(2, '0')}:00 UTC {isHourBooked(h) ? '(Booked)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            End Time
          </label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full rounded-xl recessed-channel px-3 py-2.5 text-xs font-mono font-semibold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#D9AE54]"
          >
            {HOURS.map((h) => h + 1)
              .filter((h) => h > startHour)
              .map((h) => (
                <option key={h} value={h} className="bg-[#121215]">
                  {String(h).padStart(2, '0')}:00 UTC
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Hourly Timeline Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-bold uppercase tracking-wider">Hourly Availability</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D9AE54]" /> Selected
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
                className={`py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  booked
                    ? 'bg-rose-950/30 text-rose-500 line-through cursor-not-allowed opacity-50 border border-rose-900/40'
                    : inRange
                      ? 'bg-[#D9AE54] text-black font-bold shadow-sm'
                      : 'bg-[#18181b] text-zinc-300 hover:bg-[#222226] border border-white/5'
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
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs font-medium text-rose-300">
          Selected window overlaps an active booking. Please select unreserved hours.
        </div>
      )}

      {/* Price breakdown */}
      {durationHours > 0 && !hasRangeConflict && (
        <div className="rounded-2xl bg-[#09090b]/80 p-4 space-y-2.5 border border-white/[0.04]">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>
              {formatCents(venue.pricePerHour)} × {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
            </span>
            <span className="font-semibold text-zinc-200">
              {formatCents(totalCents, { includeDecimals: true })}
            </span>
          </div>
          <div className="pt-2 border-t border-white/[0.05] flex justify-between items-baseline">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Amount
            </span>
            <span className="text-xl font-bold font-serif text-[#D9AE54]">
              {formatCents(totalCents, { includeDecimals: true })}
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={hasRangeConflict || durationHours <= 0 || submitting}
        onClick={handleProceed}
        className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider btn-volumetric-gold disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
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
