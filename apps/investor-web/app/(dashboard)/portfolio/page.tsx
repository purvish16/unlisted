'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { investorApi } from '@/lib/api';
import { formatCurrency, formatPct, formatShares, pnlColor } from '@/lib/utils';
import { StatCard } from '@/components/shared/StatCard';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export default function PortfolioPage() {
  const router = useRouter();

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: investorApi.getPortfolio,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">My Portfolio</h1>
        <p className="text-[14px] text-outline mt-1">Track your investments and returns</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Portfolio Value"
              value={portfolio ? formatCurrency(portfolio.totalValue) : '—'}
              sub={portfolio ? `${portfolio.holdings.length} companies` : undefined}
            />
            <StatCard
              label="Total Invested"
              value={portfolio ? formatCurrency(portfolio.totalInvested) : '—'}
              sub="Cost basis"
            />
            <StatCard
              label="Unrealized P&L"
              value={portfolio ? formatCurrency(portfolio.totalReturns) : '—'}
              sub={portfolio ? formatPct(portfolio.totalReturnsPct) + ' overall' : undefined}
              subColor={portfolio && portfolio.totalReturns >= 0 ? 'gain' : 'loss'}
            />
            <StatCard
              label="Companies"
              value={portfolio ? String(portfolio.holdings.length) : '—'}
              sub="Active holdings"
            />
          </>
        )}
      </div>

      {/* Holdings */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="p-6 border-b border-surface-container-low flex justify-between items-center">
          <h2 className="text-[18px] font-semibold text-on-surface">Holdings</h2>
          <button className="text-primary text-[13px] font-semibold hover:underline">
            Download Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4 text-right">Shares</th>
                <th className="px-6 py-4 text-right">Avg Price</th>
                <th className="px-6 py-4 text-right">CMP</th>
                <th className="px-6 py-4 text-right">Current Value</th>
                <th className="px-6 py-4 text-right">P&L</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : !portfolio?.holdings.length ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon="pie_chart"
                      title="No holdings yet"
                      description="Invest in unlisted companies to see your portfolio here."
                      action={
                        <Link href="/discover" className="btn-primary text-[13px] py-2 px-5">
                          Discover Companies
                        </Link>
                      }
                    />
                  </td>
                </tr>
              ) : (
                portfolio.holdings.map((h) => (
                  <tr
                    key={h.companyId}
                    className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/company/${h.companyId}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-[13px] font-bold text-primary flex-shrink-0">
                          {h.companyName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-on-surface">{h.companyName}</div>
                          <div className="text-[11px] text-outline">{h.companySector ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] tabular-nums">
                      {formatShares(h.sharesHeld)}
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] tabular-nums">
                      {formatCurrency(h.averageCostPrice)}
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] font-medium tabular-nums">
                      {formatCurrency(h.currentMarketPrice)}
                    </td>
                    <td className="px-6 py-4 text-right text-[14px] font-semibold tabular-nums">
                      {formatCurrency(h.currentValue)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-[14px] font-semibold tabular-nums ${pnlColor(h.pnl)}`}>
                          {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)}
                        </span>
                        <span className={`text-[11px] font-bold tabular-nums ${pnlColor(h.pnl)}`}>
                          {formatPct(h.pnlPct)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/company/${h.companyId}`); }}
                        className="text-primary font-bold text-[13px] px-3 py-1 bg-primary/5 rounded hover:bg-primary/10 transition-colors"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
