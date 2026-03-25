'use client';

import Link from 'next/link';
import { Badge } from '@/components/shared/Badge';
import { formatCurrency, formatPct, pnlColor } from '@/lib/utils';
import type { CompanyListItem } from '@/lib/api';

interface CompanyCardProps {
  company: CompanyListItem;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const price = company.lastTradedPrice ?? 0;
  const change = company.priceChange24h ?? 0;
  const changePct = price > 0 ? (change / (price - change)) * 100 : 0;

  return (
    <Link
      href={`/company/${company.id}`}
      className="group block bg-surface-container-lowest rounded-xl p-5 hover:shadow-floating transition-all duration-200"
      style={{ border: '1px solid rgba(193,198,214,0.15)' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-[18px] font-bold text-primary flex-shrink-0">
          {company.name.charAt(0)}
        </div>
        {company.listingStatus === 'live' && (
          <Badge variant="live">Live</Badge>
        )}
      </div>

      {/* Company name + sector */}
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
          {company.name}
        </h3>
        <p className="text-[12px] text-outline mt-0.5">{company.sector ?? '—'}</p>
      </div>

      {/* Price row */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[18px] font-bold text-on-surface tabular-nums">
            {price > 0 ? formatCurrency(price) : '—'}
          </div>
          {change !== 0 && (
            <div className={`text-[12px] font-semibold tabular-nums ${pnlColor(change)}`}>
              {change >= 0 ? '+' : ''}{formatCurrency(change)} ({formatPct(changePct)})
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-[10px] text-outline uppercase tracking-wider">Face Value</div>
          <div className="text-[12px] font-semibold text-on-surface-variant tabular-nums">
            {formatCurrency(company.faceValue)}
          </div>
        </div>
      </div>

      {/* Health score bar */}
      {company.businessHealthScore != null && (
        <div className="mt-3 pt-3 border-t border-surface-container-low">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-outline uppercase tracking-wider">Health Score</span>
            <span className="text-[11px] font-bold text-on-surface">{company.businessHealthScore}/100</span>
          </div>
          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              style={{ width: `${company.businessHealthScore}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
