'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { walletApi } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { StatCard } from '@/components/shared/StatCard';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

type ModalType = 'add' | 'withdraw' | null;

const TX_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  deposit:    { icon: 'account_balance_wallet', color: 'text-primary',   bg: 'bg-primary/10' },
  withdrawal: { icon: 'payments',               color: 'text-error',     bg: 'bg-error/10' },
  investment: { icon: 'trending_up',            color: 'text-secondary', bg: 'bg-secondary/10' },
  sale:       { icon: 'sell',                   color: 'text-primary',   bg: 'bg-primary/10' },
  dividend:   { icon: 'currency_rupee',         color: 'text-secondary', bg: 'bg-secondary/10' },
  fee:        { icon: 'receipt',                color: 'text-outline',   bg: 'bg-outline/10' },
  refund:     { icon: 'undo',                   color: 'text-primary',   bg: 'bg-primary/10' },
};

export default function WalletPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [modal, setModal] = useState<ModalType>(null);
  const [amount, setAmount] = useState('');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') setModal('add');
    else if (action === 'withdraw') setModal('withdraw');
  }, [searchParams]);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletApi.getBalance,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => walletApi.getTransactions(page, 15),
  });

  const addFundsMutation = useMutation({
    mutationFn: async () => {
      const init = await walletApi.initiateAddFunds(Number(amount));
      // In dev, orderId is returned as devNote message
      await walletApi.verifyAddFunds(init.orderId, init.amountPaise);
    },
    onSuccess: () => {
      setFeedback({ type: 'success', msg: `₹${amount} added to wallet successfully!` });
      setAmount('');
      setModal(null);
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: unknown) => {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Failed to add funds' });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const init = await walletApi.initiateWithdraw(Number(amount));
      await walletApi.verifyWithdraw(init.withdrawalId, init.amountPaise);
    },
    onSuccess: () => {
      setFeedback({ type: 'success', msg: `₹${amount} withdrawal initiated!` });
      setAmount('');
      setModal(null);
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: unknown) => {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Withdrawal failed' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (modal === 'add') addFundsMutation.mutate();
    else if (modal === 'withdraw') withdrawMutation.mutate();
  };

  const isPending = addFundsMutation.isPending || withdrawMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-on-surface">Wallet</h1>
          <p className="text-[14px] text-outline mt-1">Manage your funds</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setModal('add'); setFeedback(null); }}
            className="btn-primary text-[13px] py-2 px-5"
          >
            Add Funds
          </button>
          <button
            onClick={() => { setModal('withdraw'); setFeedback(null); }}
            className="text-primary text-[13px] font-bold py-2 px-5 rounded-xl hover:bg-surface-container-low transition-colors"
            style={{ border: '1px solid rgba(193,198,214,0.4)' }}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-xl px-4 py-3 flex items-center gap-2 text-[13px] font-semibold ${
          feedback.type === 'success' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {feedback.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {feedback.msg}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {walletLoading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Available Balance"
              value={wallet ? formatCurrency(wallet.availableBalance) : '—'}
              sub="Ready to invest or withdraw"
            />
            <StatCard
              label="In Escrow"
              value={wallet ? formatCurrency(wallet.escrowBalance) : '—'}
              sub="Locked for open orders"
            />
            <StatCard
              label="Total Invested"
              value={wallet ? formatCurrency(wallet.totalInvested) : '—'}
              sub="Since joining Unlisted"
            />
          </>
        )}
      </div>

      {/* Transaction history */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="p-6 border-b border-surface-container-low">
          <h2 className="text-[18px] font-semibold text-on-surface">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Balance After</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {txLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
              ) : !transactions?.items.length ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon="receipt_long" title="No transactions yet" />
                  </td>
                </tr>
              ) : (
                transactions.items.map((tx) => {
                  const meta = TX_ICON[tx.transactionType] ?? TX_ICON['deposit']!;
                  const isCredit = ['deposit', 'dividend', 'refund', 'sale'].includes(tx.transactionType);
                  return (
                    <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`material-symbols-outlined ${meta.color} text-[18px]`}>{meta.icon}</span>
                          </div>
                          <div>
                            <div className="text-[14px] font-medium text-on-surface">
                              {tx.description ?? tx.transactionType}
                            </div>
                            <div className="text-[11px] text-outline capitalize">{tx.transactionType}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right text-[14px] font-semibold tabular-nums ${
                        isCredit ? 'text-secondary' : 'text-error'
                      }`}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right text-[14px] tabular-nums text-on-surface-variant">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          tx.status === 'completed' ? 'text-secondary' : 'text-outline'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[12px] text-outline">
                        {formatRelativeTime(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transactions && transactions.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-container-low flex items-center justify-between">
            <span className="text-[13px] text-outline">
              Page {transactions.page} of {transactions.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(transactions.totalPages, p + 1))}
                disabled={page === transactions.totalPages}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Withdraw Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-floating p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold text-on-surface">
                {modal === 'add' ? 'Add Funds' : 'Withdraw Funds'}
              </h3>
              <button onClick={() => setModal(null)} className="text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {modal === 'add' && (
              <div className="bg-primary/5 rounded-xl p-3 text-[13px] text-primary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Test mode — funds are added instantly
              </div>
            )}

            {modal === 'withdraw' && wallet && (
              <div className="bg-surface-container-low rounded-xl p-3 text-[13px] mb-4 flex justify-between">
                <span className="text-outline">Available</span>
                <span className="font-semibold text-on-surface">{formatCurrency(wallet.availableBalance)}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[16px] font-semibold text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {['1000', '5000', '10000', '25000'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors ${
                      amount === v
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    ₹{Number(v).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isPending || !amount || Number(amount) < 100}
                className="btn-primary w-full py-3 text-[15px] disabled:opacity-60"
              >
                {isPending
                  ? 'Processing…'
                  : modal === 'add'
                  ? `Add ₹${amount ? Number(amount).toLocaleString('en-IN') : '—'}`
                  : `Withdraw ₹${amount ? Number(amount).toLocaleString('en-IN') : '—'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
