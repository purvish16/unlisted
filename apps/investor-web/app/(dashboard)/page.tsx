'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { investorApi, walletApi, companiesApi } from '@/lib/api';
import { formatCurrency, formatPct, formatShares, pnlColor, formatRelativeTime } from '@/lib/utils';
import { StatCard } from '@/components/shared/StatCard';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/shared/Skeleton';
import { CompanyCard } from '@/components/company/CompanyCard';
import { EmptyState } from '@/components/shared/EmptyState';

export default function DashboardPage() {
  const router = useRouter();

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: investorApi.getPortfolio,
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletApi.getBalance,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions-recent'],
    queryFn: () => walletApi.getTransactions(1, 5),
  });

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: companiesApi.getTrending,
  });

  const txIconMap: Record<string, { icon: string; color: string; bg: string }> = {
    deposit:    { icon: 'account_balance_wallet', color: 'text-primary',   bg: 'bg-primary/10' },
    withdrawal: { icon: 'payments',               color: 'text-error',     bg: 'bg-error/10' },
    investment: { icon: 'trending_up',            color: 'text-secondary', bg: 'bg-secondary/10' },
    sale:       { icon: 'sell',                   color: 'text-primary',   bg: 'bg-primary/10' },
    dividend:   { icon: 'currency_rupee',         color: 'text-secondary', bg: 'bg-secondary/10' },
    fee:        { icon: 'receipt',                color: 'text-outline',   bg: 'bg-outline/10' },
    refund:     { icon: 'undo',                   color: 'text-primary',   bg: 'bg-primary/10' },
  };

  return (
    <div className="p-6 space-y-8">

      {/* ── ROW 1: Portfolio Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolioLoading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Portfolio Value"
              value={portfolio ? formatCurrency(portfolio.totalValue) : '—'}
              sub={portfolio ? `Across ${portfolio.holdings.length} companies` : undefined}
            />
            <StatCard
              label="Total Invested"
              value={portfolio ? formatCurrency(portfolio.totalInvested) : '—'}
              sub="Since joining Unlisted"
            />
            <StatCard
              label="Total Returns"
              value={portfolio ? formatCurrency(portfolio.totalReturns) : '—'}
              sub={portfolio ? formatPct(portfolio.totalReturnsPct) + ' overall' : undefined}
              subColor={portfolio && portfolio.totalReturns >= 0 ? 'gain' : 'loss'}
            />
          </>
        )}

        {/* Wallet card */}
        {walletLoading ? (
          <StatCardSkeleton />
        ) : (
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-ambient flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
                Wallet Balance
              </span>
              <div className="text-[24px] font-bold tracking-[-0.02em] text-on-surface tabular-nums">
                {wallet ? formatCurrency(wallet.availableBalance) : '—'}
              </div>
              {wallet && wallet.escrowBalance > 0 && (
                <span className="text-[12px] text-outline">
                  {formatCurrency(wallet.escrowBalance)} in escrow
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/wallet?action=add')}
                className="flex-1 bg-primary text-white text-[12px] font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Add Funds
              </button>
              <button
                onClick={() => router.push('/wallet?action=withdraw')}
                className="flex-1 text-primary text-[12px] font-bold py-2 rounded-lg hover:bg-surface-container-low transition-colors"
                style={{ border: '1px solid rgba(193,198,214,0.4)' }}
              >
                Withdraw
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ROW 2: Holdings + Activity ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

        {/* Holdings table — 60% */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <div className="p-6 border-b border-surface-container-low flex justify-between items-center">
            <h2 className="text-[18px] font-semibold text-on-surface">My Holdings</h2>
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
                  <th className="px-6 py-4 text-right">P&L</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {portfolioLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                ) : !portfolio?.holdings.length ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon="pie_chart"
                        title="No holdings yet"
                        description="Discover and invest in unlisted companies to see your portfolio here."
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
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-on-surface">{h.companyName}</span>
                          <span className="text-[11px] text-outline">{h.companySector ?? '—'}</span>
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

        {/* Recent Activity + Events — 40% */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Recent Activity */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 flex-1">
            <h2 className="text-[18px] font-semibold text-on-surface mb-4">Recent Activity</h2>
            {!transactions?.items.length ? (
              <EmptyState icon="receipt_long" title="No recent activity" />
            ) : (
              <div className="space-y-4">
                {transactions.items.map((tx, i) => {
                  const meta = txIconMap[tx.transactionType] ?? txIconMap['deposit']!;
                  return (
                    <div key={tx.id} className="flex gap-3 items-start">
                      <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className={`material-symbols-outlined ${meta.color} text-[18px]`}>{meta.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-medium text-on-surface truncate">
                          {tx.description ?? tx.transactionType}
                        </span>
                        <span className="text-[12px] text-outline">
                          {formatRelativeTime(tx.createdAt)} • {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
            <h2 className="text-[18px] font-semibold text-on-surface mb-4">Upcoming Events</h2>
            <div className="space-y-3">
              {[
                { month: 'APR', day: '12', title: 'TechCo Board Meeting', sub: 'Series B Funding Discussion' },
                { month: 'MAY', day: '05', title: 'FoodCo Quarterly Recap', sub: 'Public performance dashboard' },
              ].map((ev) => (
                <div
                  key={ev.title}
                  className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg"
                  style={{ border: '1px solid rgba(193,198,214,0.1)' }}
                >
                  <div className="flex flex-col items-center justify-center bg-white px-3 py-1 rounded shadow-sm min-w-[50px]">
                    <span className="text-[10px] font-bold text-primary uppercase">{ev.month}</span>
                    <span className="text-[18px] font-bold text-on-surface leading-tight">{ev.day}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-on-surface">{ev.title}</p>
                    <p className="text-[12px] text-outline">{ev.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Trending ────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[18px] font-semibold text-on-surface">Trending on Unlisted</h2>
          <Link
            href="/discover"
            className="text-primary text-[14px] font-bold flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All Opportunities
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        {trendingLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-slate-100 rounded-xl p-5 animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high" />
                  <div className="h-5 w-20 rounded bg-surface-container-high" />
                </div>
                <div className="h-5 w-3/4 rounded bg-surface-container-high" />
                <div className="h-4 w-full rounded bg-surface-container-high" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(trending ?? []).map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
