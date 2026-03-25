'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, debouncedSearch],
    queryFn: () => adminApi.getUsers(page, debouncedSearch || undefined),
  });

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
  };

  const kycBadge = (level: number): 'pending' | 'approved' | 'live' => {
    if (level === 0) return 'pending';
    if (level < 3) return 'approved';
    return 'live';
  };

  const roleBadge = (role: string): 'admin' | 'approved' | 'pending' => {
    if (role === 'admin') return 'admin';
    if (role === 'company_admin') return 'approved';
    return 'pending';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Users</h1>
        <p className="text-[14px] text-outline mt-1">
          Manage all platform users — {data?.total ?? 0} registered
        </p>
      </div>

      {/* Search */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-4">
        <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2.5 rounded-xl max-w-sm">
          <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by mobile or name…"
            className="bg-transparent border-none focus:outline-none text-[14px] text-on-surface placeholder:text-outline w-full"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">KYC Level</th>
                <th className="px-5 py-4 text-right">Wallet Balance</th>
                <th className="px-5 py-4 text-right">Invested</th>
                <th className="px-5 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-surface-container-high rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr><td colSpan={6}><EmptyState icon="group" title="No users found" /></td></tr>
              ) : (
                data.items.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[12px] font-bold text-primary flex-shrink-0">
                          {(user.fullName ?? user.mobile).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-on-surface">
                            {user.fullName ?? '—'}
                          </div>
                          <div className="text-[11px] text-outline">{user.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={roleBadge(user.role)}>{user.role.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={kycBadge(user.kycLevel)}>L{user.kycLevel}</Badge>
                        <span className="text-[12px] text-outline capitalize">{user.kycStatus}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-[14px] tabular-nums">
                      {user.wallet ? formatCurrency(user.wallet.availableBalance) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-[14px] tabular-nums">
                      {user.wallet ? formatCurrency(user.wallet.totalInvested) : '—'}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-outline">{formatDate(user.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-surface-container-low flex items-center justify-between">
            <span className="text-[13px] text-outline">
              Page {page} of {data.totalPages} · {data.total} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
