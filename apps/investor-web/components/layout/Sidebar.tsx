'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',           icon: 'dashboard',              label: 'Dashboard',    exact: true },
  { href: '/discover',   icon: 'explore',                label: 'Discover' },
  { href: '/portfolio',  icon: 'pie_chart',              label: 'My Portfolio' },
  { href: '/watchlist',  icon: 'visibility',             label: 'Watchlist' },
  { href: '/orderbook',  icon: 'receipt_long',           label: 'Order Book' },
  { href: '/orders',     icon: 'layers',                 label: 'My Orders' },
  { href: '/wallet',     icon: 'account_balance_wallet', label: 'Wallet' },
  { href: '/tax-reports',icon: 'description',            label: 'Tax Reports' },
  { href: '/settings',   icon: 'settings',               label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, refreshToken } = useAuthStore();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignore errors
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white flex flex-col py-4 z-50"
      style={{ borderRight: '1px solid rgba(193, 198, 214, 0.15)' }}>

      {/* Brand */}
      <div className="px-6 mb-8">
        <h1 className="text-[20px] font-bold text-on-surface tracking-tight">Unlisted</h1>
        <p className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline mt-0.5">
          Invest before the IPO
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-colors duration-150',
              isActive(item)
                ? 'text-primary font-semibold bg-surface-container-low'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low',
            )}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="mt-auto px-3 border-t border-outline-variant/10 pt-3 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-[11px] font-bold text-on-primary-fixed flex-shrink-0">
            {user?.mobile.slice(-2) ?? 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[13px] font-semibold text-on-surface truncate">
              {user?.mobile ?? 'Investor'}
            </p>
            <p className="text-[11px] text-outline capitalize truncate">
              {user?.kycStatus === 'complete' ? 'KYC Verified' : 'KYC Pending'}
            </p>
          </div>
        </div>
        <button
          onClick={() => void handleLogout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] text-error hover:bg-error/5 transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
