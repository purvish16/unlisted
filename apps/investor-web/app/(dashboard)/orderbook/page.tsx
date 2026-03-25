'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { companiesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';

export default function OrderBookPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  const { data: companies } = useQuery({
    queryKey: ['companies-live'],
    queryFn: () => companiesApi.list({ limit: 50 }),
  });

  const liveCompanies = companies?.items.filter((c) => c.listingStatus === 'live') ?? [];

  const { data: orderBook, isLoading } = useQuery({
    queryKey: ['orderbook', selectedCompanyId],
    queryFn: () => companiesApi.getOrderBook(selectedCompanyId),
    enabled: !!selectedCompanyId,
    refetchInterval: 5000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Order Book</h1>
        <p className="text-[14px] text-outline mt-1">Live bid and ask prices across listed companies</p>
      </div>

      {/* Company selector */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-4">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-outline">Select Company:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="flex-1 bg-surface-container-high px-4 py-2.5 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-xs"
          >
            <option value="">— Choose a company —</option>
            {liveCompanies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {selectedCompanyId && (
            <Link
              href={`/company/${selectedCompanyId}`}
              className="text-primary text-[13px] font-semibold hover:underline"
            >
              View & Trade →
            </Link>
          )}
        </div>
      </div>

      {!selectedCompanyId ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 min-h-[360px] flex items-center justify-center">
          <EmptyState icon="candlestick_chart" title="Select a company" description="Choose a live company above to view its order book." />
        </div>
      ) : isLoading ? (
        <div className="animate-pulse grid grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-surface-container-high rounded-xl h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bids */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
            <div className="px-5 py-4 bg-secondary/5 border-b border-surface-container-low">
              <span className="text-[14px] font-bold text-secondary">Bids (Buy Orders)</span>
            </div>
            <table className="w-full text-[13px]">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-outline bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {(orderBook?.bids ?? []).slice(0, 10).map((bid, i) => (
                  <tr key={i} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-5 py-3 text-secondary font-semibold tabular-nums">{formatCurrency(bid.price)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{bid.quantity}</td>
                    <td className="px-5 py-3 text-right text-outline tabular-nums">{bid.orderCount}</td>
                  </tr>
                ))}
                {!orderBook?.bids.length && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-outline text-[13px]">No bids</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Asks */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
            <div className="px-5 py-4 bg-error/5 border-b border-surface-container-low">
              <span className="text-[14px] font-bold text-error">Asks (Sell Orders)</span>
            </div>
            <table className="w-full text-[13px]">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-outline bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {(orderBook?.asks ?? []).slice(0, 10).map((ask, i) => (
                  <tr key={i} className="hover:bg-error/5 transition-colors">
                    <td className="px-5 py-3 text-error font-semibold tabular-nums">{formatCurrency(ask.price)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{ask.quantity}</td>
                    <td className="px-5 py-3 text-right text-outline tabular-nums">{ask.orderCount}</td>
                  </tr>
                ))}
                {!orderBook?.asks.length && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-outline text-[13px]">No asks</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
