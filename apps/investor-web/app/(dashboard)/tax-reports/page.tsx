'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tradesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/shared/Badge';

const FY_OPTIONS = ['2025-26', '2024-25', '2023-24'];

export default function TaxReportsPage() {
  const [fy, setFy] = useState('2025-26');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-trades', page],
    queryFn: () => tradesApi.getMyTrades(page),
  });

  // Compute summary from trades
  const totalGain = data?.items.reduce((sum, t) => sum + t.totalAmount, 0) ?? 0;
  const totalFees = data?.items.reduce((sum, t) => sum + t.platformFee, 0) ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-on-surface">Tax Reports</h1>
          <p className="text-[14px] text-outline mt-1">
            Capital gains and transaction reports for filing ITR
          </p>
        </div>
        <button
          onClick={() => alert('PDF download coming soon')}
          className="btn-primary text-[13px] py-2 px-5 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Download PDF
        </button>
      </div>

      {/* FY selector + summary */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
        <div className="flex items-center gap-4 mb-5">
          <span className="text-[14px] font-semibold text-on-surface">Financial Year:</span>
          <div className="flex gap-2">
            {FY_OPTIONS.map((y) => (
              <button
                key={y}
                onClick={() => setFy(y)}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${
                  fy === y
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                FY {y}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">Total Trades</div>
            <div className="text-[22px] font-bold text-on-surface">{data?.total ?? '—'}</div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">Gross Trade Value</div>
            <div className="text-[22px] font-bold text-on-surface">{formatCurrency(totalGain)}</div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">Platform Fees Paid</div>
            <div className="text-[22px] font-bold text-on-surface">{formatCurrency(totalFees)}</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-primary/5 rounded-xl text-[13px] text-primary flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">info</span>
          <div>
            Unlisted share gains are taxed as <strong>capital gains</strong>. Shares held over 24 months qualify as
            long-term (LTCG at 20% with indexation). Under 24 months are short-term (STCG at slab rate).
            Consult a CA for detailed advice.
          </div>
        </div>
      </div>

      {/* Trade history */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="p-6 border-b border-surface-container-low">
          <h2 className="text-[18px] font-semibold text-on-surface">Trade History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-right">Price/Share</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Platform Fee</th>
                <th className="px-6 py-4">Settlement</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon="description" title="No trades yet" description="Your executed trades will appear here." />
                  </td>
                </tr>
              ) : (
                data.items.map((trade) => (
                  <tr key={trade.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-semibold text-on-surface">{trade.company.name}</div>
                      <div className="text-[11px] text-outline">{trade.company.sector ?? '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] tabular-nums">{trade.quantity}</td>
                    <td className="px-6 py-4 text-right text-[14px] tabular-nums">
                      {formatCurrency(trade.pricePerShare)}
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] font-semibold tabular-nums">
                      {formatCurrency(trade.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] tabular-nums text-outline">
                      {formatCurrency(trade.platformFee)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={trade.settlementStatus === 'settled' ? 'approved' : 'pending'}>
                        {trade.settlementStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[12px] text-outline">
                      {formatDate(trade.tradedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-container-low flex items-center justify-between">
            <span className="text-[13px] text-outline">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
