'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';

export default function TradesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-trades', page],
    queryFn: () => adminApi.getAllTrades(page),
  });

  // Compute summary stats
  const totalVolume = data?.items.reduce((s, t) => s + t.totalAmount, 0) ?? 0;
  const totalFees = data?.items.reduce((s, t) => s + t.platformFee, 0) ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">All Trades</h1>
        <p className="text-[14px] text-outline mt-1">
          Platform-wide secondary market trades — {data?.total ?? 0} total
        </p>
      </div>

      {/* Summary */}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Page Volume', value: formatCurrency(totalVolume) },
            { label: 'Page Fees', value: formatCurrency(totalFees) },
            { label: 'Fee Rate', value: totalVolume > 0 ? `${((totalFees / totalVolume) * 100).toFixed(2)}%` : '—' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-xl shadow-ambient p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">{s.label}</div>
              <div className="text-[18px] font-bold text-on-surface tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              <tr>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Buyer</th>
                <th className="px-5 py-4">Seller</th>
                <th className="px-5 py-4 text-right">Qty</th>
                <th className="px-5 py-4 text-right">Price/Share</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-right">Fee</th>
                <th className="px-5 py-4">Settlement</th>
                <th className="px-5 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-5 py-3"><div className="h-4 bg-surface-container-high rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr><td colSpan={9}><EmptyState icon="swap_horiz" title="No trades yet" /></td></tr>
              ) : (
                data.items.map((trade) => (
                  <tr key={trade.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-on-surface text-[13px]">{trade.company.name}</td>
                    <td className="px-5 py-3 text-[12px] text-outline">
                      {trade.buyer.fullName ?? trade.buyer.mobile}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-outline">
                      {trade.seller.fullName ?? trade.seller.mobile}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] tabular-nums">{trade.quantity}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-secondary tabular-nums">
                      {formatCurrency(trade.pricePerShare)}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold tabular-nums">
                      {formatCurrency(trade.totalAmount)}
                    </td>
                    <td className="px-5 py-3 text-right text-[12px] tabular-nums text-outline">
                      {formatCurrency(trade.platformFee)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={trade.settlementStatus === 'settled' ? 'approved' : 'pending'}>
                        {trade.settlementStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-outline">
                      {formatRelativeTime(trade.tradedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-surface-container-low flex items-center justify-between">
            <span className="text-[13px] text-outline">Page {page} of {data.totalPages} · {data.total} trades</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40">Previous</button>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
