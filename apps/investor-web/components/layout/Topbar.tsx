'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export function Topbar() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: wallet } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletApi.getBalance,
    refetchInterval: 30_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/discover?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header
      className="sticky top-0 right-0 w-full h-16 z-40 flex items-center justify-between px-8 border-b border-outline-variant/10"
      style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-96">
        <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unlisted stocks, sectors…"
            className="bg-transparent border-none focus:outline-none text-[14px] text-on-surface placeholder:text-outline w-full"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Wallet quick view */}
        {wallet && (
          <button
            onClick={() => router.push('/wallet')}
            className="hidden sm:flex items-center gap-2 text-[13px] hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">account_balance_wallet</span>
            <span className="font-semibold text-on-surface">
              {formatCurrency(wallet.availableBalance)}
            </span>
          </button>
        )}

        {/* Notifications */}
        <button className="relative text-outline hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white" />
        </button>

        {/* Add Funds CTA */}
        <button
          onClick={() => router.push('/wallet')}
          className="btn-primary text-[13px] py-2 px-4 hidden md:block"
        >
          Add Funds
        </button>
      </div>
    </header>
  );
}
