import { cn } from '@/lib/utils';

type BadgeVariant = 'approved' | 'pending' | 'live' | 'rejected' | 'gain' | 'loss' | 'new' | 'admin';

const variantStyles: Record<BadgeVariant, string> = {
  approved: 'bg-primary/10 text-primary',
  pending:  'bg-outline/10 text-outline',
  live:     'bg-secondary/10 text-secondary',
  rejected: 'bg-error/10 text-error',
  gain:     'bg-secondary/10 text-secondary',
  loss:     'bg-error/10 text-error',
  new:      'bg-primary/10 text-primary',
  admin:    'bg-tertiary-fixed text-on-tertiary-fixed-variant',
};

interface BadgeProps {
  variant?: BadgeVariant | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

export function Badge({ variant = 'pending', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', variantStyles[variant], className)}>
      {children}
    </span>
  );
}
