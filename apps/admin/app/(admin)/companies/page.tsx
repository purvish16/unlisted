'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi, type AdminCompany } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';

const STATUSES = ['all', 'under_review', 'approved', 'live', 'rejected'];

type ModalState = { company: AdminCompany; mode: 'review' | 'health' | 'go-live' } | null;

export default function CompaniesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all');
  const [modal, setModal] = useState<ModalState>(null);
  const [notes, setNotes] = useState('');
  const [healthScore, setHealthScore] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', status],
    queryFn: () => adminApi.getAllCompanies(status === 'all' ? undefined : status),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ action }: { action: 'approve' | 'reject' }) =>
      adminApi.reviewApplication(modal!.company.id, action, notes || undefined),
    onSuccess: (_, { action }) => {
      setFeedback({ type: 'success', msg: `Company ${action}d successfully.` });
      setModal(null);
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      qc.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err: unknown) => setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Action failed' }),
  });

  const goLiveMutation = useMutation({
    mutationFn: () => adminApi.goLive(modal!.company.id),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: 'Company is now live on the platform!' });
      setModal(null);
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
      qc.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err: unknown) => setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Failed' }),
  });

  const healthMutation = useMutation({
    mutationFn: () => adminApi.setHealthScore(modal!.company.id, Number(healthScore)),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: 'Health score updated.' });
      setModal(null);
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: (err: unknown) => setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Failed' }),
  });

  const statusBadge = (s: string) => {
    const map: Record<string, 'pending' | 'approved' | 'live' | 'rejected'> = {
      under_review: 'pending', approved: 'approved', live: 'live', rejected: 'rejected',
    };
    return map[s] ?? 'pending';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Companies</h1>
        <p className="text-[14px] text-outline mt-1">
          Review applications, manage listings, set health scores
        </p>
      </div>

      {feedback && (
        <div className={`rounded-xl px-4 py-3 flex items-center gap-2 text-[13px] font-semibold ${
          feedback.type === 'success' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {feedback.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {feedback.msg}
          <button onClick={() => setFeedback(null)} className="ml-auto">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-surface-container-lowest rounded-xl p-1 shadow-ambient w-fit flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors capitalize ${
              status === s ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {s === 'under_review' ? 'Under Review' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              <tr>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Admin Contact</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Health Score</th>
                <th className="px-5 py-4">Applied</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-surface-container-high rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr><td colSpan={6}><EmptyState icon="apartment" title="No companies found" /></td></tr>
              ) : (
                data.items.map((company) => (
                  <tr key={company.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-[13px] font-bold text-primary flex-shrink-0">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-on-surface">{company.name}</div>
                          <div className="text-[11px] text-outline">{company.sector ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-outline">
                      {company.members[0]?.user.mobile ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusBadge(company.listingStatus)}>
                        {company.listingStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {company.businessHealthScore != null ? (
                        <span className={`text-[14px] font-bold tabular-nums ${
                          company.businessHealthScore >= 70 ? 'text-secondary' : company.businessHealthScore >= 40 ? 'text-primary' : 'text-error'
                        }`}>{company.businessHealthScore}</span>
                      ) : (
                        <span className="text-outline">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-outline">{formatDate(company.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {company.listingStatus === 'under_review' && (
                          <button
                            onClick={() => { setModal({ company, mode: 'review' }); setNotes(''); }}
                            className="text-primary font-bold text-[12px] px-2.5 py-1 bg-primary/5 rounded hover:bg-primary/10 transition-colors"
                          >
                            Review
                          </button>
                        )}
                        {company.listingStatus === 'approved' && (
                          <button
                            onClick={() => setModal({ company, mode: 'go-live' })}
                            className="text-secondary font-bold text-[12px] px-2.5 py-1 bg-secondary/5 rounded hover:bg-secondary/10 transition-colors"
                          >
                            Go Live
                          </button>
                        )}
                        <button
                          onClick={() => { setModal({ company, mode: 'health' }); setHealthScore(String(company.businessHealthScore ?? '')); }}
                          className="text-outline font-bold text-[12px] px-2.5 py-1 bg-surface-container-low rounded hover:bg-surface-container-high transition-colors"
                        >
                          Score
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="px-5 py-3 border-t border-surface-container-low text-[13px] text-outline">
            {data.total} {data.total === 1 ? 'company' : 'companies'}
          </div>
        )}
      </div>

      {/* Review modal */}
      {modal?.mode === 'review' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-floating p-6 z-10">
            <h3 className="text-[18px] font-bold text-on-surface mb-1">Review Application</h3>
            <p className="text-[14px] text-outline mb-5">
              <span className="font-semibold text-on-surface">{modal.company.name}</span>
            </p>
            <div className="mb-4">
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">
                Review Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Documents verified, financials look solid..."
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => reviewMutation.mutate({ action: 'approve' })}
                disabled={reviewMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold bg-secondary text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {reviewMutation.isPending ? '…' : 'Approve'}
              </button>
              <button
                onClick={() => reviewMutation.mutate({ action: 'reject' })}
                disabled={reviewMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold bg-error text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                Reject
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 text-outline hover:text-on-surface transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Go Live modal */}
      {modal?.mode === 'go-live' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-floating p-6 z-10">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-[24px]">rocket_launch</span>
            </div>
            <h3 className="text-[18px] font-bold text-on-surface text-center mb-1">Go Live?</h3>
            <p className="text-[14px] text-outline text-center mb-5">
              This will enable secondary market trading for <span className="font-semibold text-on-surface">{modal.company.name}</span>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => goLiveMutation.mutate()}
                disabled={goLiveMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold bg-secondary text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {goLiveMutation.isPending ? 'Going Live…' : 'Confirm Go Live'}
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 text-outline hover:text-on-surface transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health score modal */}
      {modal?.mode === 'health' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-floating p-6 z-10">
            <h3 className="text-[18px] font-bold text-on-surface mb-1">Set Health Score</h3>
            <p className="text-[14px] text-outline mb-5">{modal.company.name}</p>
            <div className="mb-4">
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Score (0–100)</label>
              <input
                type="number" min="0" max="100"
                value={healthScore} onChange={(e) => setHealthScore(e.target.value)}
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[24px] font-bold text-center text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {healthScore && (
              <div className="mb-4">
                <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                    style={{ width: `${Math.min(Number(healthScore), 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => healthMutation.mutate()}
                disabled={healthMutation.isPending || !healthScore}
                className="flex-1 btn-primary py-2.5 text-[14px] disabled:opacity-60"
              >
                {healthMutation.isPending ? 'Saving…' : 'Save Score'}
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 text-outline hover:text-on-surface transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
