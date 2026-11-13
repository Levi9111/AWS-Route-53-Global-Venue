'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { venuesApi } from '@/api/venues';
import { bookingsApi } from '@/api/bookings';
import { formatCents } from '@/api/client';
import { Venue } from '@/api/types';
import { BookingCalendarWidget } from '@/components/BookingCalendarWidget';
import { VenueDetailSkeleton } from '@/components/Skeletons';
import { useAuth } from '@/context/AuthContext';

function BookVenueContent() {
  const params = useParams<{ venueId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const venueId = params?.venueId;
  const initialDate = searchParams.get('date') || undefined;
  const initialStartHour = Number(searchParams.get('startHour') || 10);
  const initialEndHour = Number(searchParams.get('endHour') || 14);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    venuesApi
      .getById(venueId)
      .then((v) => setVenue(v))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Venue not found'),
      )
      .finally(() => setLoading(false));
  }, [venueId]);

  const handleConfirmBooking = async (selection: {
    startTimeIso: string;
    endTimeIso: string;
    durationHours: number;
    totalCents: number;
  }) => {
    if (!user) {
      router.push(`/login?redirect=/book/${venueId}`);
      return;
    }

    setBookingError(null);
    setSubmitting(true);
    try {
      await bookingsApi.create({
        venueId,
        startTime: selection.startTimeIso,
        endTime: selection.endTimeIso,
      });
      router.push('/dashboard?booked=1');
    } catch (err: unknown) {
      setBookingError(
        err instanceof Error
          ? err.message
          : 'Could not complete booking. This slot may no longer be available.',
      );
      // Reload venue to refresh bookedSlots on conflict
      venuesApi
        .getById(venueId)
        .then((v) => setVenue(v))
        .catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <VenueDetailSkeleton />;
  }

  if (error || !venue) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-bold text-zinc-100">
          Unable to Load Reservation Flow
        </h1>
        <p className="text-sm text-zinc-400">{error}</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl btn-volumetric-gold text-xs font-bold uppercase tracking-wider"
        >
          ← Return to Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href={`/venues/${venue._id}`}
          className="text-xs font-mono text-zinc-400 hover:text-[#D9AE54] transition-colors"
        >
          ← Back to {venue.title}
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100 mt-2">
          Reserve Architectural Space
        </h1>
        <p className="text-xs font-mono text-zinc-400 mt-1">
          Select UTC schedule and interval. Concurrency locks prevent duplicate double-bookings.
        </p>
      </div>

      {!user && (
        <div className="p-4 rounded-2xl border border-[#D9AE54]/30 bg-[#D9AE54]/10 flex items-center justify-between gap-4">
          <p className="text-xs sm:text-sm font-medium text-[#D9AE54]">
            Authentication required: Please sign in or create an account to confirm your reservation.
          </p>
          <Link
            href={`/login?redirect=/book/${venue._id}`}
            className="px-4 py-2 rounded-xl btn-volumetric-gold text-xs font-bold uppercase tracking-wider shrink-0"
          >
            Sign In
          </Link>
        </div>
      )}

      {bookingError && (
        <div className="p-4 rounded-2xl border border-rose-900/60 bg-rose-950/40 text-sm font-medium text-rose-300">
          🚨 {bookingError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left: Venue Summary */}
        <div className="lg:col-span-2 surface-resting rounded-3xl overflow-hidden p-2">
          {venue.photos?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={venue.photos[0]}
              alt={venue.title}
              className="h-48 w-full object-cover rounded-2xl"
            />
          )}
          <div className="p-4 space-y-3">
            <span className="text-xs font-mono text-[#D9AE54]">
              📍 {venue.city}, {venue.country}
            </span>
            <h2 className="font-serif text-lg font-bold text-zinc-100">
              {venue.title}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">{venue.address}</p>
            <div className="pt-3 border-t border-white/[0.05] flex justify-between text-xs text-zinc-400 font-mono">
              <span>Capacity: {venue.capacity} guests</span>
              <span className="font-bold text-[#D9AE54]">
                {formatCents(venue.pricePerHour)}/hr
              </span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Date/Time Picker + Price Summary + Confirm */}
        <div className="lg:col-span-3">
          <BookingCalendarWidget
            venue={venue}
            initialDate={initialDate}
            initialStartHour={initialStartHour}
            initialEndHour={initialEndHour}
            mode="checkout"
            onConfirmSelection={handleConfirmBooking}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}

export default function BookVenuePage() {
  return (
    <Suspense fallback={<VenueDetailSkeleton />}>
      <BookVenueContent />
    </Suspense>
  );
}
