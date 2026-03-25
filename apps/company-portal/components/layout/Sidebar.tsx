'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/',           icon: 'dashboard',       label: 'Overview',     exact: true },
  { href: '/cap-table',  icon: 'pie_chart',        label: 'Cap Table' },
  { href: '/raises',     icon: 'trending_up',      label: 'Fundraising' },
  { href: '/orders',     icon: 'candlestick_chart',label: 'Order Book' },
  { href: '/updates',    icon: 'campaign',         label: 'Updates' },
  { href: '/documents',  icon: 'description',      label: 'Documents' },
  { href: '/settings',   icon: 'settings',         label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, refreshToken } = useAuthStore();

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* ignore */ }
    finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] bg-white flex flex-col py-4 z-50"
      style={{ borderRight: '1px solid rgba(193,198,214,0.15)' }}
    >
      {/* Brand */}
      <div className="px-6 mb-8">
        <h1 className="text-[20px] font-bold text-on-surface tracking-tight">Unlisted</h1>
        <p className="text-[11px] font-bold tracking-[0.05em] uppercase text-primary mt-0.5">
          Company Portal
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
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

      {/* User + logout */}
      <div className="mt-auto px-3 border-t border-outline-variant/10 pt-3 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-[11px] font-bold text-on-primary-fixed flex-shrink-0">
            {user?.mobile.slice(-2) ?? 'C'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[13px] font-semibold text-on-surface truncate">{user?.mobile ?? 'Company'}</p>
            <p className="text-[11px] text-outline capitalize truncate">Admin</p>
          </div>
        </div>
        <button
          onClick={() => void handleLogout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] text-error hover:bg-error/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
