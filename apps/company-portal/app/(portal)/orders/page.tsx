'use client';

import { useQuery } from '@tanstack/react-query';
import { companyApi, marketApi } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';

export default function OrdersPage() {
  const { data: company } = useQuery({
    queryKey: ['my-company'],
    queryFn: companyApi.getMyCompany,
  });

  const { data: orderBook, isLoading } = useQuery({
    queryKey: ['orderbook', company?.id],
    queryFn: () => marketApi.getOrderBook(company!.id),
    enabled: !!company?.id && company.listingStatus === 'live',
    refetchInterval: 5000,
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['recent-trades', company?.id],
    queryFn: () => marketApi.getRecentTrades(company!.id),
    enabled: !!company?.id && company.listingStatus === 'live',
    refetchInterval: 10_000,
  });

  if (company?.listingStatus !== 'live') {
    return (
      <div className="p-6">
        <h1 className="text-[24px] font-bold text-on-surface mb-2">Order Book</h1>
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 mt-6">
          <EmptyState
            icon="candlestick_chart"
            title="Not live yet"
            description="The order book will become available once your listing goes live on the platform."
          />
        </div>
      </div>
    );
  }

  const maxBidQty = Math.max(...(orderBook?.bids.map((b) => b.quantity) ?? [1]));
  const maxAskQty = Math.max(...(orderBook?.asks.map((a) => a.quantity) ?? [1]));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Order Book</h1>
        <p className="text-[14px] text-outline mt-1">
          Live secondary market activity for {company?.name} · refreshes every 5s
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Best Bid',
            value: orderBook?.bids[0] ? formatCurrency(orderBook.bids[0].price) : '—',
            color: 'text-secondary',
          },
          {
            label: 'Best Ask',
            value: orderBook?.asks[0] ? formatCurrency(orderBook.asks[0].price) : '—',
            color: 'text-error',
          },
          {
            label: 'Spread',
            value: orderBook?.bids[0] && orderBook?.asks[0]
              ? formatCurrency(orderBook.asks[0].price - orderBook.bids[0].price)
              : '—',
            color: 'text-on-surface',
          },
          {
            label: 'Last Trade',
            value: recentTrades?.[0] ? formatCurrency(recentTrades[0].pricePerShare) : '—',
            color: 'text-on-surface',
          },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl shadow-ambient p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">{s.label}</div>
            <div className={`text-[20px] font-bold tabular-nums ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Order book depth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bids */}
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <div className="px-5 py-4 bg-secondary/5 border-b border-surface-container-low">
            <span className="text-[14px] font-bold text-secondary">
              Bids · {orderBook?.bids.length ?? 0} levels
            </span>
          </div>
          {isLoading ? (
            <div className="p-6 animate-pulse space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-surface-container-high rounded" />
              ))}
            </div>
          ) : !orderBook?.bids.length ? (
            <EmptyState icon="trending_down" title="No bids" />
          ) : (
            <div className="divide-y divide-surface-container-low">
              {orderBook.bids.map((bid, i) => (
                <div key={i} className="relative px-5 py-3 flex items-center justify-between">
                  {/* Depth bar */}
                  <div
                    className="absolute inset-y-0 right-0 bg-secondary/8 transition-all"
                    style={{ width: `${(bid.quantity / maxBidQty) * 100}%` }}
                  />
                  <span className="relative text-[14px] font-semibold text-secondary tabular-nums">
                    {formatCurrency(bid.price)}
                  </span>
                  <div className="relative text-right">
                    <div className="text-[13px] tabular-nums">{bid.quantity.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-outline">{bid.orderCount} orders</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Asks */}
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <div className="px-5 py-4 bg-error/5 border-b border-surface-container-low">
            <span className="text-[14px] font-bold text-error">
              Asks · {orderBook?.asks.length ?? 0} levels
            </span>
          </div>
          {isLoading ? (
            <div className="p-6 animate-pulse space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-surface-container-high rounded" />
              ))}
            </div>
          ) : !orderBook?.asks.length ? (
            <EmptyState icon="trending_up" title="No asks" />
          ) : (
            <div className="divide-y divide-surface-container-low">
              {orderBook.asks.map((ask, i) => (
                <div key={i} className="relative px-5 py-3 flex items-center justify-between">
                  <div
                    className="absolute inset-y-0 left-0 bg-error/8 transition-all"
                    style={{ width: `${(ask.quantity / maxAskQty) * 100}%` }}
                  />
                  <span className="relative text-[14px] font-semibold text-error tabular-nums">
                    {formatCurrency(ask.price)}
                  </span>
                  <div className="relative text-right">
                    <div className="text-[13px] tabular-nums">{ask.quantity.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-outline">{ask.orderCount} orders</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent trades */}
      {recentTrades && recentTrades.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-container-low">
            <h2 className="text-[16px] font-semibold text-on-surface">Recent Trades</h2>
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
              {recentTrades.map((t) => (
                <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-secondary tabular-nums">{formatCurrency(t.pricePerShare)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.quantity.toLocaleString('en-IN')}</td>
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
