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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'completed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Venue Reservations
          </h1>
          <p className="text-sm text-slate-500">
            Manage your upcoming event bookings and review completed stays
          </p>
        </div>
        <Link
          href="/"
          className="self-start px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
        >
          + Explore More Venues
        </Link>
      </div>

      {justBooked && (
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-sm font-medium text-emerald-800 dark:text-emerald-200">
          🎉 Reservation confirmed! Your event space slot has been locked in.
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            tab === 'upcoming'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Upcoming & Active ({upcomingBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            tab === 'past'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Past & Cancelled ({pastBookings.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
          <p className="text-base font-bold text-slate-900 dark:text-white">
            No {tab} bookings found
          </p>
          <p className="text-xs text-slate-500">
            Browse our global catalog to reserve an event space.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Browse Spaces
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
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                      href={`/venues/${venueIdStr}`}
                      className="font-bold text-base text-slate-900 dark:text-white hover:text-indigo-600"
                    >
                      {venueObj?.title || 'Event Venue'}
                    </Link>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${statusBadge(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {venueObj && (
                    <p className="text-xs text-slate-500">
                      📍 {venueObj.address}, {venueObj.city}, {venueObj.country}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
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
                    <span className="font-bold text-slate-900 dark:text-white">
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
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
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
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs font-semibold cursor-pointer"
                      >
                        ✓ Mark Completed
                      </button>
                      <button
                        type="button"
                        disabled={actionId === booking._id}
                        onClick={() => handleCancel(booking._id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold cursor-pointer"
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
