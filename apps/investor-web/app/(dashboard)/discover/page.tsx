'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/lib/api';
import { CompanyCard } from '@/components/company/CompanyCard';
import { CompanyCardSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { debounce } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'trending',     label: 'Trending' },
  { value: 'price_asc',    label: 'Price: Low to High' },
  { value: 'price_desc',   label: 'Price: High to Low' },
  { value: 'health_desc',  label: 'Health Score' },
  { value: 'name_asc',     label: 'Name A–Z' },
];

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [sector, setSector] = useState('');
  const [sort, setSort] = useState('trending');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const fn = debounce((...args: unknown[]) => setDebouncedSearch(args[0] as string), 400);
    fn(search);
  }, [search]);

  const { data: sectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: companiesApi.getSectors,
    staleTime: Infinity,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['companies', debouncedSearch, sector, sort],
    queryFn: () => {
      const params: Parameters<typeof companiesApi.list>[0] = { page: 1, limit: 24, sortBy: sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (sector) params.sector = sector;
      return companiesApi.list(params);
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Discover Opportunities</h1>
        <p className="text-[14px] text-outline mt-1">
          Invest in high-growth unlisted companies before they go public
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 flex items-center gap-3 bg-surface-container-high px-4 py-2.5 rounded-xl">
            <span className="material-symbols-outlined text-outline text-[20px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name or sector…"
              className="bg-transparent border-none focus:outline-none text-[14px] text-on-surface placeholder:text-outline w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Sector filter */}
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="bg-surface-container-high px-4 py-2.5 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px]"
          >
            <option value="">All Sectors</option>
            {sectors?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-surface-container-high px-4 py-2.5 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[180px]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <CompanyCardSkeleton key={i} />)}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          icon="search_off"
          title="No companies found"
          description="Try adjusting your search or filters"
          action={
            <button
              onClick={() => { setSearch(''); setSector(''); setSort('trending'); }}
              className="btn-primary text-[13px] py-2 px-5"
            >
              Clear Filters
            </button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-outline">
              {data.total} {data.total === 1 ? 'company' : 'companies'} found
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.items.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
