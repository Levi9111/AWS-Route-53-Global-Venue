'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { bookingsApi } from '../../api/bookings';
import { formatCents } from '../../api/client';
import { Booking } from '../../api/types';
import { BookingsListSkeleton } from '../../components/Skeletons';
import { useAuth } from '../../context/AuthContext';

function RenterDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justBooked = searchParams.get('booked') === '1';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.getMine({ page: 1, limit: 50 });
      setBookings(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
      return;
    }
    if (user) {
      fetchBookings();
    }
  }, [authLoading, user, router, fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    setActionId(bookingId);
    try {
      await bookingsApi.cancel(bookingId);
      await fetchBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not cancel booking');
    } finally {
      setActionId(null);
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    setActionId(bookingId);
    try {
      await bookingsApi.updateStatus(bookingId, 'completed');
      await fetchBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not update booking');
    } finally {
      setActionId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <BookingsListSkeleton count={4} />
      </div>
    );
  }

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) =>
      (b.status === 'confirmed' || b.status === 'pending') &&
      new Date(b.endTime) >= now,
  );
  const pastBookings = bookings.filter(
    (b) =>
      b.status === 'completed' ||
      b.status === 'cancelled' ||
      new Date(b.endTime) < now,
  );

  const displayed = tab === 'upcoming' ? upcomingBookings : pastBookings;

  const statusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#D9AE54]/15 text-[#D9AE54] border-[#D9AE54]/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
            My Venue Reservations
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Manage your upcoming event bookings and review completed stays
          </p>
        </div>
        <Link
          href="/"
          className="self-start px-4 py-2 rounded-xl btn-volumetric-gold text-xs font-bold uppercase tracking-wider"
        >
          + Explore More Venues
        </Link>
      </div>

      {justBooked && (
        <div className="p-4 rounded-2xl border border-[#D9AE54]/40 bg-[#D9AE54]/10 text-sm font-medium text-[#D9AE54]">
          🎉 Reservation confirmed! Your event space slot has been locked in.
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl border border-rose-900/60 bg-rose-950/40 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
            tab === 'upcoming'
              ? 'bg-[#D9AE54] text-black shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          Upcoming & Active ({upcomingBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
            tab === 'past'
              ? 'bg-[#D9AE54] text-black shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          Past & Cancelled ({pastBookings.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="surface-resting rounded-3xl p-12 text-center space-y-4">
          <p className="font-serif text-xl font-bold text-zinc-100">
            No {tab} bookings found
          </p>
          <p className="text-xs font-mono text-zinc-400">
            Browse our global architectural catalog to reserve an event space.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl btn-volumetric-gold text-xs font-bold uppercase tracking-wider"
          >
            Browse Collection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((booking) => {
            const venueObj =
              typeof booking.venueId === 'object' ? booking.venueId : null;
            const venueIdStr = venueObj ? venueObj._id : String(booking.venueId);

            return (
              <div
                key={booking._id}
                className="surface-resting p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                      href={`/venues/${venueIdStr}`}
                      className="font-serif font-bold text-base text-zinc-100 hover:text-[#D9AE54] transition-colors"
                    >
                      {venueObj?.title || 'Event Venue'}
                    </Link>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${statusBadge(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {venueObj && (
                    <p className="text-xs text-zinc-400 font-mono">
                      📍 {venueObj.address}, {venueObj.city}, {venueObj.country}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 font-mono pt-1">
                    <span>
                      🗓️{' '}
                      <strong>
                        {new Date(booking.startTime)
                          .toISOString()
                          .replace('T', ' ')
                          .slice(0, 16)}{' '}
                        UTC
                      </strong>{' '}
                      →{' '}
                      <strong>
                        {new Date(booking.endTime)
                          .toISOString()
                          .replace('T', ' ')
                          .slice(0, 16)}{' '}
                        UTC
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="font-bold text-[#D9AE54]">
                      Total:{' '}
                      {formatCents(booking.totalPrice, {
                        includeDecimals: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/venues/${venueIdStr}`}
                    className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-semibold text-zinc-200 hover:bg-white/[0.05] transition-colors"
                  >
                    {booking.status === 'completed'
                      ? '★ Leave Review'
                      : 'View Venue'}
                  </Link>

                  {(booking.status === 'confirmed' ||
                    booking.status === 'pending') && (
                    <>
                      <button
                        type="button"
                        disabled={actionId === booking._id}
                        onClick={() => handleMarkCompleted(booking._id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 text-xs font-mono font-semibold cursor-pointer hover:bg-emerald-900/40"
                      >
                        ✓ Mark Completed
                      </button>
                      <button
                        type="button"
                        disabled={actionId === booking._id}
                        onClick={() => handleCancel(booking._id)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-900/40 text-xs font-mono font-semibold cursor-pointer hover:bg-rose-900/40"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RenterDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-10">
          <BookingsListSkeleton count={4} />
        </div>
      }
    >
      <RenterDashboardContent />
    </Suspense>
  );
}
