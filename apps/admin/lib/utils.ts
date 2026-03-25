import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert paise (integer stored in DB) to rupees for display.
 * All monetary DB values are in paise.
 */
export function paiseToRupees(paise: number | bigint): number {
  return Number(paise) / 100;
}

/**
 * Convert rupees (user input) to paise for DB storage.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format a paise value as an Indian Rupee string.
 * e.g. 10000000 paise → ₹1,00,000
 *
 * @param paise - Amount in paise (integer)
 * @param options.showPaise - Show decimal paise (default: false unless fraction)
 */
export function formatCurrency(
  paise: number | bigint,
  options: { showPaise?: boolean; compact?: boolean } = {},
): string {
  const rupees = paiseToRupees(paise);

  if (options.compact) {
    if (rupees >= 1_00_00_000) {
      return `₹${(rupees / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (rupees >= 1_00_000) {
      return `₹${(rupees / 1_00_000).toFixed(2)} L`;
    }
    if (rupees >= 1_000) {
      return `₹${(rupees / 1_000).toFixed(1)}K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options.showPaise ? 2 : 0,
    maximumFractionDigits: options.showPaise ? 2 : 0,
  }).format(rupees);
}

/**
 * Format a number with Indian number system commas.
 * e.g. 100000 → "1,00,000"
 */
export function formatIndianNumber(n: number | bigint): string {
  return new Intl.NumberFormat('en-IN').format(Number(n));
}

/**
 * Format a percentage with sign and 2 decimal places.
 * e.g. 12.4 → "+12.40%" | -4.0 → "-4.00%"
 */
export function formatPct(pct: number, showSign = true): string {
  const sign = showSign && pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Format share quantity with Indian number system.
 */
export function formatShares(shares: number | bigint): string {
  return formatIndianNumber(Number(shares));
}

/**
 * Returns "text-secondary" for gains and "text-error" for losses.
 */
export function pnlColor(value: number): string {
  if (value > 0) return 'text-secondary';
  if (value < 0) return 'text-error';
  return 'text-on-surface-variant';
}

/**
 * Format a Date object as a human-readable Indian date.
 * e.g. "24 Mar 2026"
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a timestamp as relative time.
 * e.g. "2 hours ago"
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

/**
 * Truncate a string to n characters with ellipsis.
 */
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
