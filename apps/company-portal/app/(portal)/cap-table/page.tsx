'use client';

import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { formatShares, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/shared/Badge';

export default function CapTablePage() {
  const { data: company } = useQuery({
    queryKey: ['my-company'],
    queryFn: companyApi.getMyCompany,
  });

  const { data: registry, isLoading } = useQuery({
    queryKey: ['share-registry'],
    queryFn: companyApi.getShareRegistry,
  });

  const totalShares = company?.totalShares ?? 0;

  const downloadCsv = () => {
    if (!registry?.items.length) return;
    const rows = [
      ['Name', 'Mobile', 'Type', 'Shares Held', 'Shares Locked', '% Ownership', 'Acquired At'],
      ...registry.items.map((r) => [
        r.shareholder.fullName ?? '—',
        r.shareholder.mobile,
        r.shareholderType,
        String(r.sharesHeld),
        String(r.sharesLocked),
        totalShares > 0 ? ((r.sharesHeld / totalShares) * 100).toFixed(4) : '—',
        formatDate(r.acquiredAt),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cap-table.csv';
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-on-surface">Cap Table</h1>
          <p className="text-[14px] text-outline mt-1">
            Complete shareholder registry — {registry?.total ?? 0} shareholders
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadCsv}
            className="flex items-center gap-2 text-primary font-bold text-[13px] px-4 py-2 rounded-xl hover:bg-surface-container-low transition-colors"
            style={{ border: '1px solid rgba(193,198,214,0.4)' }}
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      {company && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Shares', value: formatShares(company.totalShares) },
            { label: 'Face Value', value: `₹${(company.faceValue / 100).toFixed(2)}` },
            { label: 'Shareholders', value: String(registry?.total ?? '—') },
            {
              label: 'Allocated',
              value: totalShares > 0 && registry
                ? `${((registry.items.reduce((s, r) => s + r.sharesHeld, 0) / totalShares) * 100).toFixed(1)}%`
                : '—',
            },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-xl shadow-ambient p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">{s.label}</div>
              <div className="text-[20px] font-bold text-on-surface tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              <tr>
                <th className="px-6 py-4">Shareholder</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Shares Held</th>
                <th className="px-6 py-4 text-right">Locked</th>
                <th className="px-6 py-4 text-right">% Ownership</th>
                <th className="px-6 py-4">Acquired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-surface-container-high rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !registry?.items.length ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon="group" title="No shareholders yet" description="Shareholders will appear here once shares are allocated." />
                  </td>
                </tr>
              ) : (
                registry.items.map((r) => {
                  const pct = totalShares > 0 ? ((r.sharesHeld / totalShares) * 100) : 0;
                  return (
                    <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[12px] font-bold text-primary flex-shrink-0">
                            {(r.shareholder.fullName ?? r.shareholder.mobile).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[14px] font-semibold text-on-surface">
                              {r.shareholder.fullName ?? '—'}
                            </div>
                            <div className="text-[11px] text-outline">{r.shareholder.mobile}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={r.shareholderType === 'company' ? 'approved' : 'pending'}>
                          {r.shareholderType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-[14px] font-semibold tabular-nums">
                        {formatShares(r.sharesHeld)}
                      </td>
                      <td className="px-6 py-4 text-right text-[14px] text-outline tabular-nums">
                        {r.sharesLocked > 0 ? formatShares(r.sharesLocked) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[14px] font-bold tabular-nums">{pct.toFixed(2)}%</span>
                          <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[12px] text-outline">
                        {formatDate(r.acquiredAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
