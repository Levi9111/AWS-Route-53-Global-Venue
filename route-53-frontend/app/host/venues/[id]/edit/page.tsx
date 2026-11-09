'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { UpsertVenueInput, venuesApi } from '../../../../../api/venues';
import { Venue } from '../../../../../api/types';
import { VenueForm } from '../../../../../components/VenueForm';
import { VenueDetailSkeleton } from '../../../../../components/Skeletons';

export default function EditVenuePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const venueId = params?.id;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;
    venuesApi
      .getById(venueId)
      .then((v) => setVenue(v))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Venue not found'),
      )
      .finally(() => setLoading(false));
  }, [venueId]);

  const handleUpdate = async (payload: UpsertVenueInput) => {
    await venuesApi.update(venueId, payload);
    router.push('/host/dashboard');
  };

  if (loading) {
    return <VenueDetailSkeleton />;
  }

  if (error || !venue) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-base font-bold text-rose-600">
          {error || 'Venue not found'}
        </p>
        <Link
          href="/host/dashboard"
          className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          ← Back to Host Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <Link
          href="/host/dashboard"
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          ← Back to Host Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Edit Venue: {venue.title}
        </h1>
      </div>

      <VenueForm
        initialVenue={venue}
        onSubmit={handleUpdate}
        submitLabel="Save Venue Changes"
      />
    </div>
  );
}
