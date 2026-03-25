'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/shared/Badge';
import Link from 'next/link';

const STATUS_BADGE: Record<string, { variant: 'approved' | 'pending' | 'loss' | 'gain' | 'hot'; label: string }> = {
  open:            { variant: 'pending',  label: 'Open' },
  partially_filled:{ variant: 'gain',     label: 'Partial' },
  filled:          { variant: 'approved', label: 'Filled' },
  cancelled:       { variant: 'hot',      label: 'Cancelled' },
  rejected:        { variant: 'loss',     label: 'Rejected' },
};

export default function OrdersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => ordersApi.getMyOrders(page),
  });

  const cancelMutation = useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">My Orders</h1>
        <p className="text-[14px] text-outline mt-1">Track all your buy and sell orders</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold uppercase tracking-[0.05em] text-outline">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-right">Filled</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Placed</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon="receipt_long"
                      title="No orders yet"
                      description="Place buy or sell orders on the secondary market to see them here."
                      action={
                        <Link href="/discover" className="btn-primary text-[13px] py-2 px-5">
                          Discover Companies
                        </Link>
                      }
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((order) => {
                  const badge = (STATUS_BADGE[order.status] ?? STATUS_BADGE['open'])!;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                      onClick={() => order.companyId && router.push(`/company/${order.companyId}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-semibold text-on-surface">
                          {order.company?.name ?? '—'}
                        </span>
                        {order.company?.sector && (
                          <div className="text-[11px] text-outline">{order.company.sector}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[13px] font-bold capitalize ${
                            order.orderType === 'buy' ? 'text-secondary' : 'text-error'
                          }`}
                        >
                          {order.orderType}
                        </span>
                        <div className="text-[11px] text-outline capitalize">{order.orderMode}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-[14px] tabular-nums">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-[14px] tabular-nums text-outline">
                        {order.filledQuantity}
                      </td>
                      <td className="px-6 py-4 text-right text-[14px] tabular-nums">
                        {order.pricePerShare != null ? formatCurrency(order.pricePerShare) : 'Market'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-[12px] text-outline">
                        {formatRelativeTime(order.placedAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {order.status === 'open' || order.status === 'partially_filled' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelMutation.mutate(order.id);
                            }}
                            disabled={cancelMutation.isPending}
                            className="text-error font-bold text-[12px] px-3 py-1 bg-error/5 rounded hover:bg-error/10 transition-colors disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-outline text-[12px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-container-low flex items-center justify-between">
            <span className="text-[13px] text-outline">
              Page {data.page} of {data.totalPages} • {data.total} orders
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
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-surface-container-low text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors"
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
