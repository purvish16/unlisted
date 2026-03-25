'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi, raisesApi, ordersApi } from '@/lib/api';
import { formatCurrency, formatPct, formatShares, pnlColor, formatDate, formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';

type TradeTab = 'primary' | 'secondary';
type OrderMode = 'limit' | 'market';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'orderbook' | 'updates'>('overview');
  const [tradeTab, setTradeTab] = useState<TradeTab>('secondary');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderMode, setOrderMode] = useState<OrderMode>('limit');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');
  const [tradeError, setTradeError] = useState('');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companiesApi.getById(id),
  });

  const { data: orderBook } = useQuery({
    queryKey: ['orderbook', id],
    queryFn: () => companiesApi.getOrderBook(id),
    refetchInterval: 5000,
    enabled: activeTab === 'orderbook',
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['recentTrades', id],
    queryFn: () => companiesApi.getTrades(id),
    enabled: activeTab === 'orderbook',
  });

  const activePrimary = company?.primaryRaises?.find(
    (r) => r.status === 'open' || r.status === 'funded',
  );

  const investMutation = useMutation({
    mutationFn: () =>
      raisesApi.invest(activePrimary!.id, Math.round(Number(investAmount) * 100)),
    onSuccess: () => {
      setTradeSuccess('Investment placed successfully!');
      setInvestAmount('');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
    onError: (err: unknown) => {
      setTradeError(err instanceof Error ? err.message : 'Investment failed');
    },
  });

  const orderMutation = useMutation({
    mutationFn: () => {
      const orderData: Parameters<typeof ordersApi.place>[0] = {
        companyId: id,
        orderType: orderSide,
        orderMode,
        quantity: Number(qty),
      };
      if (orderMode === 'limit' && price) {
        orderData.pricePerShare = Math.round(Number(price) * 100);
      }
      return ordersApi.place(orderData);
    },
    onSuccess: () => {
      setTradeSuccess(`${orderSide === 'buy' ? 'Buy' : 'Sell'} order placed!`);
      setQty('');
      setPrice('');
      qc.invalidateQueries({ queryKey: ['orderbook', id] });
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
    onError: (err: unknown) => {
      setTradeError(err instanceof Error ? err.message : 'Order failed');
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 w-64 bg-surface-container-high rounded" />
        <div className="h-4 w-48 bg-surface-container-high rounded" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-container-high rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 text-center text-outline">Company not found.</div>
    );
  }

  const primaryProgress = activePrimary
    ? (activePrimary.raisedAmount / activePrimary.targetAmount) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] text-outline hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </button>

      {/* Hero */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Logo + name */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center text-[24px] font-bold text-primary flex-shrink-0">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-bold text-on-surface">{company.name}</h1>
                <Badge variant={company.listingStatus === 'live' ? 'live' : company.listingStatus === 'approved' ? 'approved' : 'pending'}>
                  {company.listingStatus}
                </Badge>
              </div>
              <p className="text-[14px] text-outline mt-0.5">{company.sector ?? '—'}</p>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-primary hover:underline mt-1 inline-block"
                >
                  {company.website}
                </a>
              )}
            </div>
          </div>

          {/* Price block */}
          {company.lastTradedPrice != null && (
            <div className="text-right">
              <div className="text-[28px] font-bold text-on-surface tabular-nums">
                {formatCurrency(company.lastTradedPrice)}
              </div>
              {company.priceChange24h != null && (
                <div className={`text-[14px] font-semibold tabular-nums ${pnlColor(company.priceChange24h)}`}>
                  {company.priceChange24h >= 0 ? '+' : ''}{formatCurrency(company.priceChange24h)} today
                </div>
              )}
              <div className="text-[12px] text-outline mt-0.5">
                Face value: {formatCurrency(company.faceValue)}
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        {company.businessHealthScore != null && (
          <div className="mt-6 pt-5 border-t border-surface-container-low grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-outline">Health Score</div>
              <div className="text-[18px] font-bold text-on-surface mt-0.5">{company.businessHealthScore}/100</div>
              <div className="h-1.5 bg-surface-container-high rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  style={{ width: `${company.businessHealthScore}%` }}
                />
              </div>
            </div>
            {company.foundedYear && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-outline">Founded</div>
                <div className="text-[18px] font-bold text-on-surface mt-0.5">{company.foundedYear}</div>
              </div>
            )}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-outline">Total Shares</div>
              <div className="text-[18px] font-bold text-on-surface mt-0.5">
                {formatShares(company.totalShares)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main grid: content tabs + trade panel */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left: tabs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 bg-surface-container-lowest rounded-xl p-1 shadow-ambient w-fit">
            {(['overview', 'orderbook', 'updates'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab === 'orderbook' ? 'Order Book' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 space-y-5">
              {company.description && (
                <div>
                  <h3 className="text-[14px] font-bold uppercase tracking-wider text-outline mb-2">About</h3>
                  <p className="text-[14px] text-on-surface leading-relaxed">{company.description}</p>
                </div>
              )}
              {activePrimary && (
                <div>
                  <h3 className="text-[14px] font-bold uppercase tracking-wider text-outline mb-3">Primary Raise</h3>
                  <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-[14px]">
                      <span className="text-outline">Price per share</span>
                      <span className="font-semibold text-on-surface">{formatCurrency(activePrimary.pricePerShare)}</span>
                    </div>
                    <div className="flex justify-between text-[14px]">
                      <span className="text-outline">Target raise</span>
                      <span className="font-semibold text-on-surface">{formatCurrency(activePrimary.targetAmount, { compact: true })}</span>
                    </div>
                    <div className="flex justify-between text-[14px]">
                      <span className="text-outline">Raised so far</span>
                      <span className="font-semibold text-secondary">{formatCurrency(activePrimary.raisedAmount, { compact: true })}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[12px] text-outline mb-1">
                        <span>Progress</span>
                        <span>{primaryProgress.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                          style={{ width: `${Math.min(primaryProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-[12px] text-outline">
                      <span>Min: {formatCurrency(activePrimary.minInvestment, { compact: true })}</span>
                      <span>Closes: {formatDate(activePrimary.raiseClosesAt)}</span>
                    </div>
                  </div>
                </div>
              )}
              {company.cin && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'CIN', value: company.cin },
                    { label: 'PAN', value: company.pan },
                    { label: 'GSTIN', value: company.gstin },
                  ].filter(f => f.value).map((f) => (
                    <div key={f.label} className="bg-surface-container-low rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-outline">{f.label}</div>
                      <div className="text-[13px] font-semibold text-on-surface mt-0.5 font-mono">{f.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Order Book */}
          {activeTab === 'orderbook' && (
            <div className="space-y-4">
              <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-surface-container-low">
                  {/* Bids */}
                  <div>
                    <div className="px-4 py-3 bg-secondary/5 border-b border-surface-container-low">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Bids (Buy)</span>
                    </div>
                    <table className="w-full text-[13px]">
                      <thead className="text-[10px] font-bold uppercase tracking-wider text-outline">
                        <tr>
                          <th className="px-4 py-2 text-left">Price</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2 text-right">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low">
                        {(orderBook?.bids ?? []).slice(0, 8).map((bid, i) => (
                          <tr key={i} className="hover:bg-secondary/5 transition-colors">
                            <td className="px-4 py-2.5 text-secondary font-semibold tabular-nums">
                              {formatCurrency(bid.price)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{bid.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-outline tabular-nums">{bid.orderCount}</td>
                          </tr>
                        ))}
                        {!orderBook?.bids.length && (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-outline text-[12px]">No bids</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Asks */}
                  <div>
                    <div className="px-4 py-3 bg-error/5 border-b border-surface-container-low">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-error">Asks (Sell)</span>
                    </div>
                    <table className="w-full text-[13px]">
                      <thead className="text-[10px] font-bold uppercase tracking-wider text-outline">
                        <tr>
                          <th className="px-4 py-2 text-left">Price</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2 text-right">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low">
                        {(orderBook?.asks ?? []).slice(0, 8).map((ask, i) => (
                          <tr key={i} className="hover:bg-error/5 transition-colors">
                            <td className="px-4 py-2.5 text-error font-semibold tabular-nums">
                              {formatCurrency(ask.price)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{ask.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-outline tabular-nums">{ask.orderCount}</td>
                          </tr>
                        ))}
                        {!orderBook?.asks.length && (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-outline text-[12px]">No asks</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent trades */}
              {recentTrades && recentTrades.length > 0 && (
                <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
                  <div className="px-5 py-4 border-b border-surface-container-low">
                    <h3 className="text-[14px] font-semibold text-on-surface">Recent Trades</h3>
                  </div>
                  <table className="w-full text-[13px]">
                    <thead className="text-[10px] font-bold uppercase tracking-wider text-outline bg-surface-container-low">
                      <tr>
                        <th className="px-5 py-3 text-left">Price</th>
                        <th className="px-5 py-3 text-right">Qty</th>
                        <th className="px-5 py-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {recentTrades.slice(0, 10).map((trade) => (
                        <tr key={trade.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className={`px-5 py-3 font-semibold tabular-nums ${pnlColor(1)}`}>
                            {formatCurrency(trade.pricePerShare)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">{trade.quantity}</td>
                          <td className="px-5 py-3 text-right text-outline">{formatRelativeTime(trade.tradedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Updates */}
          {activeTab === 'updates' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 space-y-4">
              {!company.updates?.length ? (
                <p className="text-[14px] text-outline text-center py-8">No updates yet</p>
              ) : (
                company.updates.map((update) => (
                  <div
                    key={update.id}
                    className="border-b border-surface-container-low pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[15px] font-semibold text-on-surface">{update.title}</h3>
                        <p className="text-[13px] text-on-surface-variant mt-1 leading-relaxed">{update.content}</p>
                      </div>
                      <Badge variant={update.type === 'financial' ? 'approved' : 'pending'}>
                        {update.type}
                      </Badge>
                    </div>
                    {update.publishedAt && (
                      <p className="text-[11px] text-outline mt-2">{formatDate(update.publishedAt)}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Trade panel */}
        <div className="lg:col-span-3">
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-5 sticky top-20">
            <h3 className="text-[16px] font-bold text-on-surface mb-4">Trade</h3>

            {/* Primary / Secondary tabs */}
            <div className="flex gap-1 bg-surface-container-low rounded-lg p-1 mb-4">
              {(['secondary', 'primary'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTradeTab(tab)}
                  disabled={tab === 'primary' && !activePrimary}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-bold transition-colors capitalize ${
                    tradeTab === tab
                      ? 'bg-white text-primary shadow-ambient'
                      : 'text-outline hover:text-on-surface disabled:opacity-40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {tradeSuccess && (
              <div className="bg-secondary/10 text-secondary text-[13px] font-semibold rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {tradeSuccess}
              </div>
            )}
            {tradeError && (
              <div className="bg-error/10 text-error text-[13px] font-semibold rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {tradeError}
              </div>
            )}

            {/* Primary raise form */}
            {tradeTab === 'primary' && activePrimary && (
              <div className="space-y-3">
                <div className="bg-surface-container-low rounded-lg p-3 text-[13px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-outline">Price/share</span>
                    <span className="font-semibold">{formatCurrency(activePrimary.pricePerShare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Min. investment</span>
                    <span className="font-semibold">{formatCurrency(activePrimary.minInvestment, { compact: true })}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline block mb-1.5">
                    Investment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => { setInvestAmount(e.target.value); setTradeError(''); setTradeSuccess(''); }}
                    placeholder={`Min ${formatCurrency(activePrimary.minInvestment, { compact: true })}`}
                    className="w-full bg-surface-container-high px-3 py-2.5 rounded-lg text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {investAmount && activePrimary.pricePerShare > 0 && (
                  <p className="text-[12px] text-outline">
                    ≈ {Math.floor(Number(investAmount) * 100 / activePrimary.pricePerShare)} shares
                  </p>
                )}
                <button
                  onClick={() => investMutation.mutate()}
                  disabled={investMutation.isPending || !investAmount}
                  className="btn-primary w-full py-2.5 text-[14px] disabled:opacity-60"
                >
                  {investMutation.isPending ? 'Processing…' : 'Invest Now'}
                </button>
              </div>
            )}

            {/* Secondary order form */}
            {tradeTab === 'secondary' && (
              <div className="space-y-3">
                {/* Buy / Sell toggle */}
                <div className="flex gap-1 bg-surface-container-low rounded-lg p-1">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-colors ${
                      orderSide === 'buy' ? 'bg-secondary text-white' : 'text-outline'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-colors ${
                      orderSide === 'sell' ? 'bg-error text-white' : 'text-outline'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Limit / Market */}
                <div className="flex gap-1">
                  {(['limit', 'market'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setOrderMode(mode)}
                      className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold border transition-colors capitalize ${
                        orderMode === mode
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-outline-variant/20 text-outline hover:border-primary/40'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline block mb-1.5">
                    Quantity (shares)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => { setQty(e.target.value); setTradeError(''); setTradeSuccess(''); }}
                    placeholder="0"
                    className="w-full bg-surface-container-high px-3 py-2.5 rounded-lg text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Price (limit only) */}
                {orderMode === 'limit' && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-outline block mb-1.5">
                      Price per share (₹)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={price}
                      onChange={(e) => { setPrice(e.target.value); setTradeError(''); setTradeSuccess(''); }}
                      placeholder={company.lastTradedPrice ? String(company.lastTradedPrice / 100) : '0.00'}
                      className="w-full bg-surface-container-high px-3 py-2.5 rounded-lg text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}

                {/* Order value */}
                {qty && (orderMode === 'market' || price) && (
                  <div className="bg-surface-container-low rounded-lg p-3 text-[13px] flex justify-between">
                    <span className="text-outline">Order value</span>
                    <span className="font-semibold text-on-surface">
                      {orderMode === 'limit' && price
                        ? formatCurrency(Math.round(Number(qty) * Number(price) * 100))
                        : '~Market price'}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => orderMutation.mutate()}
                  disabled={orderMutation.isPending || !qty || (orderMode === 'limit' && !price)}
                  className={`w-full py-2.5 text-[14px] font-bold rounded-xl text-white transition-opacity disabled:opacity-60 ${
                    orderSide === 'buy'
                      ? 'bg-secondary hover:opacity-90'
                      : 'bg-error hover:opacity-90'
                  }`}
                >
                  {orderMutation.isPending
                    ? 'Placing order…'
                    : `Place ${orderSide === 'buy' ? 'Buy' : 'Sell'} Order`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
