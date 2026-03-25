'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { companyApi, marketApi } from '@/lib/api';
import { formatCurrency, formatShares, formatRelativeTime } from '@/lib/utils';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';

export default function OverviewPage() {
  const { data: company, isLoading } = useQuery({
    queryKey: ['my-company'],
    queryFn: companyApi.getMyCompany,
  });

  const { data: registry } = useQuery({
    queryKey: ['share-registry'],
    queryFn: companyApi.getShareRegistry,
    enabled: !!company,
  });

  const { data: orderBook } = useQuery({
    queryKey: ['orderbook', company?.id],
    queryFn: () => marketApi.getOrderBook(company!.id),
    enabled: !!company && company.listingStatus === 'live',
    refetchInterval: 10_000,
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['recent-trades', company?.id],
    queryFn: () => marketApi.getRecentTrades(company!.id),
    enabled: !!company && company.listingStatus === 'live',
  });

  const { data: updates } = useQuery({
    queryKey: ['company-updates'],
    queryFn: companyApi.getUpdates,
  });

  const activePrimary = company?.primaryRaises?.find(
    (r) => r.status === 'open' || r.status === 'funded',
  );

  const totalSharesHeld = registry?.items.reduce((s, r) => s + r.sharesHeld, 0) ?? 0;
  const primaryProgress = activePrimary
    ? (activePrimary.raisedAmount / activePrimary.targetAmount) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 w-64 bg-surface-container-high rounded" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-container-high rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-on-surface">Overview</h1>
          <p className="text-[14px] text-outline mt-1">
            Welcome back — here's your company at a glance
          </p>
        </div>
        {company && (
          <Badge variant={company.listingStatus === 'live' ? 'live' : company.listingStatus === 'approved' ? 'approved' : 'pending'}>
            {company.listingStatus}
          </Badge>
        )}
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Market Price"
          value={company?.lastTradedPrice ? formatCurrency(company.lastTradedPrice) : '—'}
          sub={company?.priceChange24h != null
            ? `${company.priceChange24h >= 0 ? '+' : ''}${formatCurrency(company.priceChange24h)} today`
            : undefined}
          subColor={company?.priceChange24h != null && company.priceChange24h >= 0 ? 'gain' : 'loss'}
          icon="show_chart"
        />
        <StatCard
          label="Total Shareholders"
          value={registry ? String(registry.total) : '—'}
          sub="Registered holders"
          icon="group"
        />
        <StatCard
          label="Shares Outstanding"
          value={company ? formatShares(company.totalShares) : '—'}
          sub={totalSharesHeld > 0 ? `${formatShares(totalSharesHeld)} allocated` : undefined}
          icon="pie_chart"
        />
        <StatCard
          label="Health Score"
          value={company?.businessHealthScore != null ? `${company.businessHealthScore}/100` : '—'}
          sub="Platform assessment"
          icon="monitoring"
        />
      </div>

      {/* Primary raise progress + order book */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left: Raise + recent updates */}
        <div className="lg:col-span-6 space-y-6">
          {/* Fundraising progress */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold text-on-surface">Fundraising</h2>
              <Link href="/raises" className="text-primary text-[13px] font-semibold hover:underline">
                Manage →
              </Link>
            </div>
            {!activePrimary ? (
              <EmptyState
                icon="trending_up"
                title="No active raise"
                description="Start a primary fundraising round to raise capital from investors."
                action={
                  <Link href="/raises" className="btn-primary text-[13px] py-2 px-5">
                    Start a Raise
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">Target</div>
                    <div className="text-[18px] font-bold text-on-surface">{formatCurrency(activePrimary.targetAmount, { compact: true })}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">Raised</div>
                    <div className="text-[18px] font-bold text-secondary">{formatCurrency(activePrimary.raisedAmount, { compact: true })}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">Price/Share</div>
                    <div className="text-[18px] font-bold text-on-surface">{formatCurrency(activePrimary.pricePerShare)}</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[12px] text-outline mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-on-surface">{primaryProgress.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${Math.min(primaryProgress, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-outline">Min investment: <span className="text-on-surface font-semibold">{formatCurrency(activePrimary.minInvestment, { compact: true })}</span></span>
                  <Badge variant={activePrimary.status === 'open' ? 'live' : 'approved'}>
                    {activePrimary.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Recent updates */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold text-on-surface">Recent Updates</h2>
              <Link href="/updates" className="text-primary text-[13px] font-semibold hover:underline">
                All Updates →
              </Link>
            </div>
            {!updates?.length ? (
              <EmptyState
                icon="campaign"
                title="No updates yet"
                description="Publish updates to keep your investors informed."
              />
            ) : (
              <div className="space-y-3">
                {updates.slice(0, 3).map((u) => (
                  <div
                    key={u.id}
                    className="flex gap-3 p-3 bg-surface-container-low rounded-lg"
                  >
                    <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5">
                      {u.type === 'financial' ? 'bar_chart' : u.type === 'milestone' ? 'flag' : 'campaign'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-on-surface">{u.title}</p>
                      <p className="text-[12px] text-outline mt-0.5 line-clamp-1">{u.content}</p>
                      <p className="text-[11px] text-outline/60 mt-0.5">{formatRelativeTime(u.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order book preview + top shareholders */}
        <div className="lg:col-span-4 space-y-6">
          {/* Order book snapshot */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-on-surface">Live Order Book</h2>
              <Link href="/orders" className="text-primary text-[13px] font-semibold hover:underline">View →</Link>
            </div>
            {company?.listingStatus !== 'live' ? (
              <p className="text-[13px] text-outline text-center py-6">
                Order book available once listing goes live.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold uppercase tracking-wider text-outline mb-2">
                  <span>Best Bids</span>
                  <span className="text-right">Best Asks</span>
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 text-[13px]">
                    <span className="text-secondary font-semibold tabular-nums">
                      {orderBook?.bids[i] ? formatCurrency(orderBook.bids[i].price) : '—'}
                    </span>
                    <span className="text-error font-semibold tabular-nums text-right">
                      {orderBook?.asks[i] ? formatCurrency(orderBook.asks[i].price) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top shareholders */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-on-surface">Top Shareholders</h2>
              <Link href="/cap-table" className="text-primary text-[13px] font-semibold hover:underline">Cap Table →</Link>
            </div>
            {!registry?.items.length ? (
              <EmptyState icon="group" title="No shareholders yet" />
            ) : (
              <div className="space-y-2">
                {registry.items.slice(0, 5).map((r) => {
                  const pct = company ? ((r.sharesHeld / company.totalShares) * 100).toFixed(2) : '—';
                  return (
                    <div key={r.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                        {(r.shareholder.fullName ?? r.shareholder.mobile).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-on-surface truncate">
                          {r.shareholder.fullName ?? r.shareholder.mobile}
                        </p>
                        <p className="text-[11px] text-outline">{formatShares(r.sharesHeld)} shares</p>
                      </div>
                      <span className="text-[13px] font-bold text-on-surface-variant tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent trades */}
      {company?.listingStatus === 'live' && recentTrades && recentTrades.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <div className="p-5 border-b border-surface-container-low">
            <h2 className="text-[18px] font-semibold text-on-surface">Recent Trades</h2>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-outline">
              <tr>
                <th className="px-5 py-3">Price/Share</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3 text-right">Total Value</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {recentTrades.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-secondary tabular-nums">{formatCurrency(t.pricePerShare)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.quantity}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatCurrency(t.totalAmount)}</td>
                  <td className="px-5 py-3 text-right text-outline">{formatRelativeTime(t.tradedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
