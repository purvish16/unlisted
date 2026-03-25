'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';

export default function WatchlistPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Watchlist</h1>
        <p className="text-[14px] text-outline mt-1">Track companies you're interested in</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 min-h-[400px] flex items-center justify-center">
        <EmptyState
          icon="visibility"
          title="Your watchlist is empty"
          description="Browse companies and add them to your watchlist to track price movements."
          action={
            <Link href="/discover" className="btn-primary text-[13px] py-2 px-5">
              Discover Companies
            </Link>
          }
        />
      </div>
    </div>
  );
}
