import React from 'react';

export function VenueCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs animate-pulse">
      <div className="h-52 bg-slate-200 dark:bg-slate-800 w-full" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
        </div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-14" />
        </div>
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-28" />
        </div>
      </div>
    </div>
  );
}

export function VenueGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <VenueCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function VenueDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-80">
        <div className="md:col-span-2 bg-slate-200 dark:bg-slate-800 rounded-2xl h-full" />
        <div className="hidden md:flex flex-col gap-4 h-full">
          <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}

export function BookingsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between gap-4"
        >
          <div className="space-y-2.5 flex-1">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
