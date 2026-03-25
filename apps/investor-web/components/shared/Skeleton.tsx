import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-md skeleton', className)}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-ambient flex flex-col gap-2">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-8 w-36 mt-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function CompanyCardSkeleton() {
  return (
    <div className="border border-slate-100 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex justify-between">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-between mt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
