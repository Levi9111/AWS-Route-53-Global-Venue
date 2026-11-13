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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-bold text-zinc-100">
          Venue Unavailable
        </h1>
        <p className="text-sm text-zinc-400">
          {error || 'This venue could not be found.'}
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl btn-volumetric-gold text-xs font-bold uppercase tracking-wider"
        >
          ← Return to Collection
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Link href="/" className="hover:text-[#D9AE54] transition-colors">
              ← Global Collection
            </Link>
            <span>•</span>
            <span className="text-[#D9AE54]">
              {venue.city}, {venue.country}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-zinc-100 tracking-tight">
            {venue.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-400 font-mono">
            <span>📍 {venue.address}</span>
            <span>•</span>
            <span>👥 Up to {venue.capacity} guests</span>
            {venue.reviewCount !== undefined && venue.reviewCount > 0 && (
              <>
                <span>•</span>
                <span className="font-bold text-[#D9AE54]">
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
            className="self-start px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-200 hover:bg-white/[0.04] transition-colors"
          >
            ✏️ Edit Venue
          </Link>
        )}
      </div>

      {/* Photo Gallery with dark gutter tile design */}
      <div className="space-y-3">
        <div className="relative h-80 sm:h-[480px] w-full rounded-3xl overflow-hidden bg-[#141417] border border-white/[0.06] p-1.5 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[activePhotoIdx] || photos[0]}
            alt={venue.title}
            className="w-full h-full object-cover rounded-2xl"
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
                    ? 'border-[#D9AE54] ring-2 ring-[#D9AE54]/30 scale-[1.02]'
                    : 'border-transparent opacity-60 hover:opacity-100'
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
          <section className="space-y-4 border-b border-white/[0.06] pb-8">
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              Architectural Profile
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line font-normal">
              {venue.description}
            </p>
            {hostObj && (
              <div className="pt-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1d1d21] border border-white/10 text-[#D9AE54] flex items-center justify-center font-serif font-bold text-base shadow-sm">
                  {hostObj.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    Curated by {hostObj.name}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">
                    Verified Host Partner • Coordinates: {venue.lat.toFixed(4)}°, {venue.lng.toFixed(4)}°
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Amenities */}
          <section className="space-y-4 border-b border-white/[0.06] pb-8">
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              Technical Amenities & Event Infrastructure
            </h2>
            {venue.amenities && venue.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {venue.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.06] bg-[#141417] text-xs font-medium text-zinc-200"
                  >
                    <span className="text-[#D9AE54]">✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Full standard event production access included.
              </p>
            )}
          </section>

          {/* Reviews Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-zinc-100">
                Guest Reviews ({reviewsTotal})
              </h2>
            </div>

            {/* Leave a Review */}
            {completedBookings.length > 0 && (
              <form
                onSubmit={handleReviewSubmit}
                className="p-6 rounded-3xl surface-resting space-y-4"
              >
                <h3 className="text-sm font-bold text-zinc-100">
                  Share your experience from your completed booking
                </h3>

                {reviewErrors.form && (
                  <p className="text-xs font-medium text-rose-400">
                    {reviewErrors.form}
                  </p>
                )}
                {reviewSuccess && (
                  <p className="text-xs font-medium text-emerald-400">
                    {reviewSuccess}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Completed Booking
                    </label>
                    <select
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="w-full rounded-xl recessed-channel px-3 py-2 text-xs font-mono text-zinc-200"
                    >
                      {completedBookings.map((b) => (
                        <option key={b._id} value={b._id} className="bg-[#121215]">
                          {new Date(b.startTime).toISOString().slice(0, 10)} ({b._id.slice(-6)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Rating (1 - 5 Stars)
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full rounded-xl recessed-channel px-3 py-2 text-xs font-mono text-zinc-200"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r} className="bg-[#121215]">
                          {'★'.repeat(r)} ({r}/5)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Your Review
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe the atmosphere, acoustics, and production support..."
                    className="w-full rounded-xl recessed-channel px-3 py-2 text-sm text-zinc-100"
                  />
                  {reviewErrors.comment && (
                    <p className="text-xs text-rose-400 mt-1">
                      {reviewErrors.comment}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 rounded-xl btn-volumetric-gold text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {reviewSubmitting ? 'Publishing...' : 'Publish Review'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <div className="p-6 rounded-2xl surface-resting text-sm text-zinc-500">
                No reviews yet for this space. Book and complete an event to leave the first review!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => {
                  const author =
                    typeof rev.authorId === 'object' ? rev.authorId : null;
                  return (
                    <div
                      key={rev._id}
                      className="p-5 rounded-2xl surface-resting space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-zinc-200">
                          {author?.name || 'Verified Renter'}
                        </span>
                        <span className="text-xs font-bold text-[#D9AE54]">
                          {'★'.repeat(rev.rating)}
                          {'☆'.repeat(Math.max(0, 5 - rev.rating))}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300">
                        {rev.comment}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-500">
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
