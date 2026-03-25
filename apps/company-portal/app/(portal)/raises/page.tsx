'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';

export default function RaisesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pricePerShare: '',
    targetAmount: '',
    minInvestment: '',
    maxInvestment: '',
    raiseOpensAt: '',
    raiseClosesAt: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: company } = useQuery({
    queryKey: ['my-company'],
    queryFn: companyApi.getMyCompany,
  });

  const activePrimary = company?.primaryRaises?.find(
    (r) => r.status === 'open' || r.status === 'funded' || r.status === 'draft',
  );

  const allRaises = company?.primaryRaises ?? [];
  const primaryProgress = activePrimary
    ? (activePrimary.raisedAmount / activePrimary.targetAmount) * 100
    : 0;

  const createMutation = useMutation({
    mutationFn: () =>
      companyApi.createRaise({
        pricePerShare: Math.round(Number(form.pricePerShare) * 100),
        targetAmount: Math.round(Number(form.targetAmount) * 100),
        minInvestment: Math.round(Number(form.minInvestment) * 100),
        maxInvestment: Math.round(Number(form.maxInvestment) * 100),
        raiseOpensAt: form.raiseOpensAt,
        raiseClosesAt: form.raiseClosesAt,
      }),
    onSuccess: () => {
      setSuccess('Fundraising round created and submitted for review!');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['my-company'] });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to create raise');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.pricePerShare || !form.targetAmount || !form.minInvestment || !form.maxInvestment || !form.raiseOpensAt || !form.raiseClosesAt) {
      setError('Please fill all fields');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-on-surface">Fundraising</h1>
          <p className="text-[14px] text-outline mt-1">Manage primary capital raises</p>
        </div>
        {!activePrimary && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-[13px] py-2 px-5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Raise
          </button>
        )}
      </div>

      {success && (
        <div className="bg-secondary/10 text-secondary text-[13px] font-semibold rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {success}
        </div>
      )}

      {/* Active raise */}
      {activePrimary && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-semibold text-on-surface">Active Raise</h2>
            <Badge variant={activePrimary.status === 'open' ? 'live' : activePrimary.status === 'funded' ? 'approved' : 'pending'}>
              {activePrimary.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Price/Share', value: formatCurrency(activePrimary.pricePerShare) },
              { label: 'Target', value: formatCurrency(activePrimary.targetAmount, { compact: true }) },
              { label: 'Raised', value: formatCurrency(activePrimary.raisedAmount, { compact: true }) },
              { label: 'Min Investment', value: formatCurrency(activePrimary.minInvestment, { compact: true }) },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-low rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1">{s.label}</div>
                <div className="text-[16px] font-bold text-on-surface">{s.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-[12px] text-outline mb-1.5">
              <span>Funding Progress</span>
              <span className="font-semibold text-on-surface">{primaryProgress.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${Math.min(primaryProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between text-[12px] text-outline mt-3">
            <span>Opens: <span className="text-on-surface font-semibold">{formatDate(activePrimary.raiseOpensAt)}</span></span>
            <span>Closes: <span className="text-on-surface font-semibold">{formatDate(activePrimary.raiseClosesAt)}</span></span>
          </div>
        </div>
      )}

      {/* New raise form */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-semibold text-on-surface">New Fundraising Round</h2>
            <button onClick={() => setShowForm(false)} className="text-outline hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { key: 'pricePerShare',  label: 'Price per Share (₹)',     type: 'number', placeholder: '100.00' },
              { key: 'targetAmount',   label: 'Target Raise Amount (₹)', type: 'number', placeholder: '5000000' },
              { key: 'minInvestment',  label: 'Min Investment (₹)',       type: 'number', placeholder: '10000' },
              { key: 'maxInvestment',  label: 'Max Investment (₹)',       type: 'number', placeholder: '500000' },
              { key: 'raiseOpensAt',   label: 'Opens At',                 type: 'date',   placeholder: '' },
              { key: 'raiseClosesAt',  label: 'Closes At',                type: 'date',   placeholder: '' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}

            {error && (
              <div className="md:col-span-2">
                <p className="text-[13px] text-error">{error}</p>
              </div>
            )}

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary py-3 px-8 text-[14px] disabled:opacity-60"
              >
                {createMutation.isPending ? 'Submitting…' : 'Submit for Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="py-3 px-6 text-[14px] text-outline hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Raise history */}
      {allRaises.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
          <div className="p-5 border-b border-surface-container-low">
            <h2 className="text-[16px] font-semibold text-on-surface">Raise History</h2>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-outline">
              <tr>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Price/Share</th>
                <th className="px-5 py-3 text-right">Target</th>
                <th className="px-5 py-3 text-right">Raised</th>
                <th className="px-5 py-3">Opens</th>
                <th className="px-5 py-3">Closes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {allRaises.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-5 py-3">
                    <Badge variant={r.status === 'open' ? 'live' : r.status === 'funded' ? 'approved' : 'pending'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(r.pricePerShare)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(r.targetAmount, { compact: true })}</td>
                  <td className="px-5 py-3 text-right text-secondary tabular-nums">{formatCurrency(r.raisedAmount, { compact: true })}</td>
                  <td className="px-5 py-3 text-outline">{formatDate(r.raiseOpensAt)}</td>
                  <td className="px-5 py-3 text-outline">{formatDate(r.raiseClosesAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!activePrimary && allRaises.length === 0 && !showForm && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 min-h-[300px] flex items-center justify-center">
          <EmptyState
            icon="trending_up"
            title="No fundraising rounds yet"
            description="Create a primary fundraising round to start accepting investor capital."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary text-[13px] py-2 px-5">
                Start a Raise
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
