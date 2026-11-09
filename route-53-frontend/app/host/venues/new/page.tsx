'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UpsertVenueInput, venuesApi } from '../../../../api/venues';
import { VenueForm } from '../../../../components/VenueForm';

export default function NewVenuePage() {
  const router = useRouter();

  const handleCreate = async (payload: UpsertVenueInput) => {
    const created = await venuesApi.create(payload);
    router.push(`/venues/${created._id}`);
  };

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
          List a New Event Space
        </h1>
        <p className="text-sm text-slate-500">
          Publish your venue to the Global VenueFinder catalog.
        </p>
      </div>

      <VenueForm
        onSubmit={handleCreate}
        submitLabel="Publish Venue Listing"
      />
    </div>
  );
}
