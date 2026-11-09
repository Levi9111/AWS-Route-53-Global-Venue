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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D9AE54]">
            Host Operations Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100 mt-1">
            Venue & Booking Management
          </h1>
        </div>
        <Link
          href="/host/venues/new"
          className="self-start px-5 py-2.5 rounded-xl btn-volumetric-gold text-xs font-bold uppercase tracking-wider"
        >
          + List New Architectural Space
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-900/60 bg-rose-950/40 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-resting p-5 rounded-3xl">
          <p className="text-[11px] font-mono font-semibold uppercase text-zinc-400">
            Curated Spaces
          </p>
          <p className="font-serif text-3xl font-bold text-zinc-100 mt-1">
            {venues.length}
          </p>
        </div>
        <div className="surface-resting p-5 rounded-3xl">
          <p className="text-[11px] font-mono font-semibold uppercase text-zinc-400">
            Total Inquiries
          </p>
          <p className="font-serif text-3xl font-bold text-zinc-100 mt-1">
            {bookings.length}
          </p>
        </div>
        <div className="surface-resting p-5 rounded-3xl">
          <p className="text-[11px] font-mono font-semibold uppercase text-zinc-400">
            Confirmed Stays
          </p>
          <p className="font-serif text-3xl font-bold text-emerald-400 mt-1">
            {activeBookings.length}
          </p>
        </div>
        <div className="surface-resting p-5 rounded-3xl">
          <p className="text-[11px] font-mono font-semibold uppercase text-zinc-400">
            Gross Booking Volume
          </p>
          <p className="font-serif text-3xl font-bold text-[#D9AE54] mt-1">
            {formatCents(totalRevenueCents, { includeDecimals: true })}
          </p>
        </div>
      </div>

      {/* Host's Venues Section */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-zinc-100">
          Your Curated Spaces ({venues.length})
        </h2>

        {venues.length === 0 ? (
          <div className="surface-resting p-10 rounded-3xl text-center space-y-3">
            <p className="font-serif text-lg font-bold text-zinc-100">
              You haven&apos;t listed any venues yet
            </p>
            <p className="text-xs font-mono text-zinc-400">
              Create your first architectural listing to start receiving bookings.
            </p>
            <Link
              href="/host/venues/new"
              className="inline-block px-4 py-2 rounded-xl btn-volumetric-gold text-xs font-bold uppercase tracking-wider"
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
                  className="surface-resting p-5 rounded-3xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/venues/${venue._id}`}
                        className="font-serif font-bold text-base text-zinc-100 hover:text-[#D9AE54] transition-colors line-clamp-1"
                      >
                        {venue.title}
                      </Link>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#D9AE54]/15 text-[#D9AE54] border border-[#D9AE54]/30 shrink-0">
                        {formatCents(venue.pricePerHour)}/hr
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      📍 {venue.city}, {venue.country} • 👥 {venue.capacity} guests
                    </p>
                    <p className="text-xs font-mono text-zinc-300">
                      📅 {venueBookingsCount} {venueBookingsCount === 1 ? 'booking' : 'bookings'} recorded
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedVenueFilter(
                          selectedVenueFilter === venue._id ? 'all' : venue._id,
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold cursor-pointer ${
                        selectedVenueFilter === venue._id
                          ? 'bg-[#D9AE54] text-black'
                          : 'bg-[#18181b] border border-white/5 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {selectedVenueFilter === venue._id
                        ? 'Showing Bookings'
                        : 'Filter Bookings'}
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/host/venues/${venue._id}/edit`}
                        className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-semibold text-zinc-200 hover:bg-white/[0.04]"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === venue._id}
                        onClick={() => handleDeleteVenue(venue._id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300 text-xs font-mono font-semibold hover:bg-rose-900/50 cursor-pointer"
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
          <h2 className="font-serif text-2xl font-bold text-zinc-100">
            Incoming Venue Bookings ({filteredBookings.length})
          </h2>
          {selectedVenueFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedVenueFilter('all')}
              className="text-xs font-mono text-[#D9AE54] hover:underline cursor-pointer"
            >
              Show bookings for all venues
            </button>
          )}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="surface-resting p-8 rounded-3xl text-center text-sm font-mono text-zinc-400">
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
                  className="surface-resting p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-sm text-zinc-100">
                        {vObj?.title || 'Venue'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border border-white/10 bg-[#161619] text-zinc-300">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      👤 Renter: {rObj?.name || 'Guest'} ({rObj?.email || 'verified'})
                    </p>
                    <p className="text-xs font-mono text-zinc-300">
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
                      <strong className="text-[#D9AE54]">
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
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 text-xs font-mono font-semibold hover:bg-emerald-900/50 cursor-pointer"
                      >
                        Confirm
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={busyId === b._id}
                        onClick={() => handleBookingStatus(b._id, 'complete')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#D9AE54] text-black text-xs font-mono font-bold cursor-pointer hover:brightness-110"
                      >
                        Mark Completed
                      </button>
                    )}
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        type="button"
                        disabled={busyId === b._id}
                        onClick={() => handleBookingStatus(b._id, 'cancel')}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-900/40 text-xs font-mono font-semibold hover:bg-rose-900/50 cursor-pointer"
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
