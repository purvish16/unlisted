'use client';

import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { Badge } from '@/components/shared/Badge';

export function Topbar() {
  const { data: company } = useQuery({
    queryKey: ['my-company'],
    queryFn: companyApi.getMyCompany,
    staleTime: 60_000,
  });

  const statusVariant = company?.listingStatus === 'live'
    ? 'live'
    : company?.listingStatus === 'approved'
    ? 'approved'
    : 'pending';

  return (
    <header
      className="sticky top-0 right-0 w-full h-16 z-40 flex items-center justify-between px-8 border-b border-outline-variant/10"
      style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-3">
        {company && (
          <>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-[14px] font-bold text-primary">
              {company.name.charAt(0)}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-on-surface leading-tight">{company.name}</p>
              <p className="text-[11px] text-outline">{company.sector ?? 'Unlisted Company'}</p>
            </div>
            <Badge variant={statusVariant}>{company.listingStatus}</Badge>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-outline hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white" />
        </button>
        <a
          href="https://investors.unlisted.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-outline hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          Public View
        </a>
      </div>
    </header>
  );
}
