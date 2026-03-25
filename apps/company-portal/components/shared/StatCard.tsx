import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string | undefined;
  subColor?: 'gain' | 'loss' | 'neutral' | undefined;
  icon?: string | undefined;
  className?: string | undefined;
}

export function StatCard({ label, value, sub, subColor = 'neutral', icon, className }: StatCardProps) {
  const subColorClass = {
    gain: 'text-secondary font-semibold',
    loss: 'text-error font-semibold',
    neutral: 'text-outline font-medium',
  }[subColor];

  return (
    <div className={cn('bg-surface-container-lowest p-6 rounded-xl shadow-ambient flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
          {label}
        </span>
        {icon && (
          <span className="material-symbols-outlined text-[20px] text-outline">{icon}</span>
        )}
      </div>
      <div className="text-[24px] font-bold tracking-[-0.02em] text-on-surface tabular-nums">
        {value}
      </div>
      {sub && <span className={cn('text-[12px]', subColorClass)}>{sub}</span>}
    </div>
  );
}
