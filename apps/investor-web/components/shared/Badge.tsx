import { cn } from '@/lib/utils';

type BadgeVariant = 'high-demand' | 'new' | 'limited' | 'hot' | 'live' | 'approved' | 'pending' | 'gain' | 'loss';

const variantStyles: Record<BadgeVariant, string> = {
  'high-demand': 'bg-secondary-container/30 text-secondary',
  'new':         'bg-primary/10 text-primary',
  'limited':     'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  'hot':         'bg-outline-variant/30 text-outline',
  'live':        'bg-secondary/10 text-secondary',
  'approved':    'bg-primary/10 text-primary',
  'pending':     'bg-outline/10 text-outline',
  'gain':        'bg-secondary/10 text-secondary',
  'loss':        'bg-error/10 text-error',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'pending', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
