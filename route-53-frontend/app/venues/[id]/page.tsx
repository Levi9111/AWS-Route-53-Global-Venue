'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { venuesApi } from '@/api/venues';
import { reviewsApi } from '@/api/reviews';
import { bookingsApi } from '@/api/bookings';
import { Booking, Review, Venue } from '@/api/types';
import { BookingCalendarWidget } from '@/components/BookingCalendarWidget';
import { VenueDetailSkeleton } from '@/components/Skeletons';
import { useAuth } from '@/context/AuthContext';
import { extractFieldErrors, reviewFormSchema } from '@/lib/validations';

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80';

export default function VenueDetailPage() {
  const params = useParams<{ id: string }>();
  const venueId = params?.id;
  const { user } = useAuth();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState<number>(0);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  // Review form state
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const loadVenueAndReviews = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    setError(null);
    try {
      const [v, revRes] = await Promise.all([
        venuesApi.getById(venueId),
        reviewsApi.getByVenue(venueId, { page: 1, limit: 20 }),
      ]);
      setVenue(v);
      setReviews(revRes.data || []);
      setReviewsTotal(revRes.total || 0);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load venue details.',
      );
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadVenueAndReviews();
  }, [loadVenueAndReviews]);

  // If logged in, check if user has any completed bookings for this venue so they can leave a review
  useEffect(() => {
    if (!user || !venueId) return;
    bookingsApi
      .getMine({ limit: 50 })
      .then((res) => {
        const eligible = (res.data || []).filter((b) => {
          const bVenueId =
            typeof b.venueId === 'object' ? b.venueId._id : b.venueId;
          return bVenueId === venueId && b.status === 'completed';
        });
        setCompletedBookings(eligible);
        if (eligible.length > 0) {
          setSelectedBookingId(eligible[0]._id);
        }
      })
      .catch(() => {});
  }, [user, venueId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewErrors({});
    setReviewSuccess(null);

    const parsed = reviewFormSchema.safeParse({
      bookingId: selectedBookingId,
      rating,
      comment,
    });

    if (!parsed.success) {
      setReviewErrors(extractFieldErrors(parsed.error));
      return;
    }

    setReviewSubmitting(true);
    try {
      await reviewsApi.create({
        bookingId: parsed.data.bookingId,
        venueId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      });
      setComment('');
      setReviewSuccess('Thank you! Your review has been published.');
      await loadVenueAndReviews();
    } catch (err: unknown) {
      setReviewErrors({
        form:
          err instanceof Error ? err.message : 'Could not submit your review.',
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return <VenueDetailSkeleton />;
  }

  if (error || !venue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Venue Unavailable
        </h1>
        <p className="text-sm text-slate-500">
          {error || 'This venue could not be found.'}
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
        >
          ← Back to Search
        </Link>
      </div>
    );
  }

  const photos =
    venue.photos && venue.photos.length > 0 ? venue.photos : [FALLBACK_PHOTO];
  const hostObj = typeof venue.hostId === 'object' ? venue.hostId : null;
  const isOwner =
    user &&
    ((hostObj && hostObj._id === user._id) ||
      (typeof venue.hostId === 'string' && venue.hostId === user._id) ||
      user.role === 'admin');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-indigo-600 font-medium">
              ← All Spaces
            </Link>
            <span>•</span>
            <span>
              {venue.city}, {venue.country}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {venue.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <span>📍 {venue.address}</span>
            <span>•</span>
            <span>👥 Up to {venue.capacity} guests</span>
            {venue.reviewCount !== undefined && venue.reviewCount > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  ★ {venue.averageRating} ({venue.reviewCount}{' '}
                  {venue.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </>
            )}
          </div>
        </div>

        {isOwner && (
          <Link
            href={`/host/venues/${venue._id}/edit`}
            className="self-start px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✏️ Edit Venue
          </Link>
        )}
      </div>

      {/* Photo Gallery */}
      <div className="space-y-3">
        <div className="relative h-72 sm:h-[420px] w-full rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[activePhotoIdx] || photos[0]}
            alt={venue.title}
            className="w-full h-full object-cover"
          />
        </div>
        {photos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {photos.map((url, idx) => (
              <button
                key={url + idx}
                type="button"
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative h-20 w-32 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                  activePhotoIdx === idx
                    ? 'border-indigo-600 ring-2 ring-indigo-600/30'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left 2 Columns: Description, Amenities, Reviews */}
        <div className="lg:col-span-2 space-y-10">
          {/* About */}
          <section className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              About this Event Space
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {venue.description}
            </p>
            {hostObj && (
              <div className="pt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                  {hostObj.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Hosted by {hostObj.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Verified Venue Partner • Coordinates: {venue.lat.toFixed(4)}
                    °, {venue.lng.toFixed(4)}°
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Amenities */}
          <section className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Included Amenities & Equipment
            </h2>
            {venue.amenities && venue.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {venue.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    <span className="text-indigo-600 dark:text-indigo-400">
                      ✓
                    </span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Standard event access included.
              </p>
            )}
          </section>

          {/* Reviews Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Guest Reviews ({reviewsTotal})
              </h2>
            </div>

            {/* Leave a Review (only shown if user has a completed booking on this venue) */}
            {completedBookings.length > 0 && (
              <form
                onSubmit={handleReviewSubmit}
                className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Share your experience from your completed booking
                </h3>

                {reviewErrors.form && (
                  <p className="text-xs font-medium text-rose-600">
                    {reviewErrors.form}
                  </p>
                )}
                {reviewSuccess && (
                  <p className="text-xs font-medium text-emerald-600">
                    {reviewSuccess}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Completed Booking
                    </label>
                    <select
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                    >
                      {completedBookings.map((b) => (
                        <option key={b._id} value={b._id}>
                          {new Date(b.startTime).toISOString().slice(0, 10)} (
                          {b._id.slice(-6)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Rating (1 - 5 Stars)
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>
                          {'★'.repeat(r)} ({r}/5)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Your Review
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="How was the space, acoustics, and host support?"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                  {reviewErrors.comment && (
                    <p className="text-xs text-rose-600 mt-1">
                      {reviewErrors.comment}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Publish Review'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-500">
                No reviews yet for this space. Book and complete an event to
                leave the first review!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => {
                  const author =
                    typeof rev.authorId === 'object' ? rev.authorId : null;
                  return (
                    <div
                      key={rev._id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {author?.name || 'Verified Renter'}
                        </span>
                        <span className="text-xs font-bold text-amber-500">
                          {'★'.repeat(rev.rating)}
                          {'☆'.repeat(Math.max(0, 5 - rev.rating))}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {rev.comment}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toISOString().slice(0, 10)} UTC
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Sticky Booking Calendar Widget */}
        <div className="lg:sticky lg:top-24">
          <BookingCalendarWidget venue={venue} mode="preview" />
        </div>
      </div>
    </div>
  );
}
