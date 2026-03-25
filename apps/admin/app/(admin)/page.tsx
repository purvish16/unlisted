'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatShares } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  iconColor?: string;
  href?: string;
}

function StatCard({ label, value, sub, icon, iconColor = 'text-primary', href }: StatCardProps) {
  const content = (
    <div className="bg-surface-container-lowest p-5 rounded-xl shadow-ambient flex items-start gap-4 hover:shadow-floating transition-all">
      <div className={`w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-outlined text-[22px] ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-0.5">{label}</div>
        <div className="text-[22px] font-bold text-on-surface tabular-nums leading-tight">{value}</div>
        {sub && <div className="text-[12px] text-outline mt-0.5">{sub}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminOverview() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.getMetrics,
    refetchInterval: 30_000,
  });

  const { data: applications } = useQuery({
    queryKey: ['admin-applications', 'under_review'],
    queryFn: () => adminApi.getApplications('under_review'),
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['admin-trades'],
    queryFn: () => adminApi.getAllTrades(1),
  });

  const pendingCount = applications?.total ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Platform Overview</h1>
        <p className="text-[14px] text-outline mt-1">Real-time platform metrics and activity</p>
      </div>

      {/* Key metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-container-high rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={metrics?.totalUsers.toLocaleString('en-IN') ?? '—'} icon="people" iconColor="text-primary" href="/users" />
            <StatCard label="Investors" value={metrics?.totalInvestors.toLocaleString('en-IN') ?? '—'} icon="person" iconColor="text-secondary" href="/users" />
            <StatCard label="Companies" value={metrics?.totalCompanies.toLocaleString('en-IN') ?? '—'} icon="apartment" iconColor="text-primary" href="/companies" />
            <StatCard label="Live Companies" value={metrics?.liveCompanies.toLocaleString('en-IN') ?? '—'} icon="check_circle" iconColor="text-secondary" href="/companies" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Trades" value={metrics?.totalTrades.toLocaleString('en-IN') ?? '—'} icon="swap_horiz" iconColor="text-primary" href="/trades" />
            <StatCard label="Trade Volume" value={metrics ? formatCurrency(metrics.totalTradeVolume, { compact: true }) : '—'} icon="bar_chart" iconColor="text-secondary" />
            <StatCard label="Platform Fees" value={metrics ? formatCurrency(metrics.totalPlatformFees, { compact: true }) : '—'} icon="payments" iconColor="text-secondary" />
            <StatCard label="Wallet Balance" value={metrics ? formatCurrency(metrics.totalWalletBalance, { compact: true }) : '—'} icon="account_balance_wallet" iconColor="text-primary" />
          </div>
        </>
      )}

      {/* KYC stats + Pending actions */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* KYC breakdown */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-ambient p-6">
          <h2 className="text-[16px] font-semibold text-on-surface mb-5">KYC Distribution</h2>
          {metrics ? (
            <div className="space-y-3">
              {[
                { label: 'Level 0 — Unverified', count: metrics.kycStats.level0, color: 'bg-outline/30' },
                { label: 'Level 1 — PAN Verified', count: metrics.kycStats.level1, color: 'bg-primary/40' },
                { label: 'Level 2 — Aadhaar Verified', count: metrics.kycStats.level2, color: 'bg-primary/70' },
                { label: 'Level 3 — Full KYC', count: metrics.kycStats.level3, color: 'bg-secondary' },
              ].map((level) => {
                const pct = metrics.totalUsers > 0 ? (level.count / metrics.totalUsers) * 100 : 0;
                return (
                  <div key={level.label}>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-on-surface-variant">{level.label}</span>
                      <span className="font-semibold text-on-surface">{level.count.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${level.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-surface-container-high rounded" />)}
            </div>
          )}
        </div>

        {/* Pending actions */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-xl shadow-ambient p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-semibold text-on-surface">Pending Actions</h2>
            {pendingCount > 0 && (
              <span className="text-[12px] font-bold text-white bg-error rounded-full px-2 py-0.5">
                {pendingCount}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {[
              {
                icon: 'apartment',
                label: 'Company Applications',
                count: pendingCount,
                desc: 'awaiting review',
                href: '/companies?status=under_review',
                color: pendingCount > 0 ? 'text-error' : 'text-outline',
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center flex-shrink-0">
                  <span className={`material-symbols-outlined text-[20px] ${action.color}`}>{action.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-on-surface">{action.label}</p>
                  <p className="text-[12px] text-outline">{action.count} {action.desc}</p>
                </div>
                <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent trades */}
      {recentTrades && recentTrades.items.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <div className="p-5 border-b border-surface-container-low flex justify-between items-center">
            <h2 className="text-[16px] font-semibold text-on-surface">Recent Trades</h2>
            <Link href="/trades" className="text-primary text-[13px] font-semibold hover:underline">View All →</Link>
          </div>
          <table className="w-full text-[13px] text-left">
            <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-outline">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Buyer</th>
                <th className="px-5 py-3">Seller</th>
                <th className="px-5 py-3 text-right">Qty</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Value</th>
                <th className="px-5 py-3 text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {recentTrades.items.slice(0, 6).map((t) => (
                <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-on-surface">{t.company.name}</td>
                  <td className="px-5 py-3 text-outline">{t.buyer.fullName ?? t.buyer.mobile}</td>
                  <td className="px-5 py-3 text-outline">{t.seller.fullName ?? t.seller.mobile}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.quantity}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-secondary font-semibold">{formatCurrency(t.pricePerShare)}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">{formatCurrency(t.totalAmount)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-outline">{formatCurrency(t.platformFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
