'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/store/auth';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex overflow-hidden min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-surface-container-low">
          {children}
        </main>
      </div>
    </div>
  );
}
