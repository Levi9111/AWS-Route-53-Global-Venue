'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { venuesApi } from '../../../api/venues';
import { bookingsApi } from '../../../api/bookings';
import { formatCents } from '../../../api/client';
import { Booking, Venue } from '../../../api/types';
import { BookingsListSkeleton } from '../../../components/Skeletons';
import { useAuth } from '../../../context/AuthContext';

export default function HostDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadHostData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [vRes, bRes] = await Promise.all([
        venuesApi.list({ hostId: user._id, limit: 50 }),
        bookingsApi.getHostBookings({ limit: 100 }),
      ]);
      setVenues(vRes.data || []);
      setBookings(bRes.data || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load host dashboard',
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/host/dashboard');
      return;
    }
    if (user) {
      loadHostData();
    }
  }, [authLoading, user, router, loadHostData]);

  const handleDeleteVenue = async (venueId: string) => {
    setBusyId(venueId);
    try {
      await venuesApi.remove(venueId);
      await loadHostData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete venue');
    } finally {
      setBusyId(null);
    }
  };

  const handleBookingStatus = async (
    bookingId: string,
    action: 'confirm' | 'complete' | 'cancel',
  ) => {
    setBusyId(bookingId);
    try {
      if (action === 'cancel') {
        await bookingsApi.cancel(bookingId);
      } else if (action === 'confirm') {
        await bookingsApi.updateStatus(bookingId, 'confirmed');
      } else {
        await bookingsApi.updateStatus(bookingId, 'completed');
      }
      await loadHostData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <BookingsListSkeleton count={4} />
      </div>
    );
  }

  const activeBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed',
  );
  const totalRevenueCents = activeBookings.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0,
  );

  const filteredBookings =
    selectedVenueFilter === 'all'
      ? bookings
      : bookings.filter((b) => {
          const vId =
            typeof b.venueId === 'object' ? b.venueId._id : String(b.venueId);
          return vId === selectedVenueFilter;
        });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Host Operations Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Venue & Booking Management
          </h1>
        </div>
        <Link
          href="/host/venues/new"
          className="self-start px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
        >
          + List New Event Space
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Listed Venues
          </p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {venues.length}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Total Bookings
          </p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {bookings.length}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Confirmed / Completed
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeBookings.length}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Gross Booking Volume
          </p>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCents(totalRevenueCents, { includeDecimals: true })}
          </p>
        </div>
      </div>

      {/* Host's Venues Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Your Listed Spaces ({venues.length})
        </h2>

        {venues.length === 0 ? (
          <div className="p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              You haven&apos;t listed any venues yet
            </p>
            <p className="text-xs text-slate-500">
              Create your first event space listing to start receiving bookings.
            </p>
            <Link
              href="/host/venues/new"
              className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              + Create First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {venues.map((venue) => {
              const venueBookingsCount = bookings.filter((b) => {
                const vId =
                  typeof b.venueId === 'object'
                    ? b.venueId._id
                    : String(b.venueId);
                return vId === venue._id;
              }).length;

              return (
                <div
                  key={venue._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/venues/${venue._id}`}
                        className="font-bold text-base text-slate-900 dark:text-white hover:text-indigo-600 line-clamp-1"
                      >
                        {venue.title}
                      </Link>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                        {formatCents(venue.pricePerHour)}/hr
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      📍 {venue.city}, {venue.country} • 👥 {venue.capacity}{' '}
                      guests
                    </p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      📅 {venueBookingsCount}{' '}
                      {venueBookingsCount === 1 ? 'booking' : 'bookings'}{' '}
                      recorded
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedVenueFilter(
                          selectedVenueFilter === venue._id ? 'all' : venue._id,
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        selectedVenueFilter === venue._id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {selectedVenueFilter === venue._id
                        ? 'Showing Bookings'
                        : 'Filter Bookings'}
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/host/venues/${venue._id}/edit`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === venue._id}
                        onClick={() => handleDeleteVenue(venue._id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Incoming Bookings Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Incoming Venue Bookings ({filteredBookings.length})
          </h2>
          {selectedVenueFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedVenueFilter('all')}
              className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              Show bookings for all venues
            </button>
          )}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-sm text-slate-500">
            No bookings found for the selected filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const vObj = typeof b.venueId === 'object' ? b.venueId : null;
              const rObj = typeof b.renterId === 'object' ? b.renterId : null;

              return (
                <div
                  key={b._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {vObj?.title || 'Venue'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      👤 Renter: {rObj?.name || 'Guest'} (
                      {rObj?.email || 'verified'})
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      🗓️{' '}
                      {new Date(b.startTime)
                        .toISOString()
                        .replace('T', ' ')
                        .slice(0, 16)}{' '}
                      UTC →{' '}
                      {new Date(b.endTime)
                        .toISOString()
                        .replace('T', ' ')
                        .slice(0, 16)}{' '}
                      UTC •{' '}
                      <strong>
                        {formatCents(b.totalPrice, { includeDecimals: true })}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {b.status === 'pending' && (
                      <button
                        type="button"
                        disabled={busyId === b._id}
                        onClick={() => handleBookingStatus(b._id, 'confirm')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirm
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={busyId === b._id}
                        onClick={() => handleBookingStatus(b._id, 'complete')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        type="button"
                        disabled={busyId === b._id}
                        onClick={() => handleBookingStatus(b._id, 'cancel')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
