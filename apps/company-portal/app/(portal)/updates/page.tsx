'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';

const UPDATE_TYPES = [
  { value: 'general',    label: 'General', icon: 'campaign' },
  { value: 'financial',  label: 'Financial Report', icon: 'bar_chart' },
  { value: 'milestone',  label: 'Milestone', icon: 'flag' },
  { value: 'regulatory', label: 'Regulatory', icon: 'gavel' },
];

export default function UpdatesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'general' });
  const [error, setError] = useState('');

  const { data: updates, isLoading } = useQuery({
    queryKey: ['company-updates'],
    queryFn: companyApi.getUpdates,
  });

  const createMutation = useMutation({
    mutationFn: () => companyApi.createUpdate(form),
    onSuccess: () => {
      setShowForm(false);
      setForm({ title: '', content: '', type: 'general' });
      qc.invalidateQueries({ queryKey: ['company-updates'] });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to publish update');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required');
      return;
    }
    setError('');
    createMutation.mutate();
  };

  const typeIcon = (type: string) =>
    UPDATE_TYPES.find((t) => t.value === type)?.icon ?? 'campaign';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-on-surface">Updates</h1>
          <p className="text-[14px] text-outline mt-1">
            Publish announcements, financial reports, and milestones to your investors
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="btn-primary text-[13px] py-2 px-5 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Update
        </button>
      </div>

      {/* New update form */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-semibold text-on-surface">Publish Update</h2>
            <button onClick={() => setShowForm(false)} className="text-outline hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">
                Update Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {UPDATE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                      form.type === t.value
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Q3 2025 Financial Results"
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={6}
                placeholder="Write your update here. Be clear and transparent with your investors."
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            {error && <p className="text-[13px] text-error">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary py-2.5 px-8 text-[14px] disabled:opacity-60 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                {createMutation.isPending ? 'Publishing…' : 'Publish Update'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="py-2.5 px-6 text-[14px] text-outline hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Updates list */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 animate-pulse space-y-3">
              <div className="h-5 w-48 bg-surface-container-high rounded" />
              <div className="h-4 w-full bg-surface-container-high rounded" />
              <div className="h-4 w-3/4 bg-surface-container-high rounded" />
            </div>
          ))
        ) : !updates?.length ? (
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 min-h-[300px] flex items-center justify-center">
            <EmptyState
              icon="campaign"
              title="No updates yet"
              description="Publish regular updates to build investor confidence."
              action={
                <button onClick={() => setShowForm(true)} className="btn-primary text-[13px] py-2 px-5">
                  Publish First Update
                </button>
              }
            />
          </div>
        ) : (
          updates.map((u) => (
            <div key={u.id} className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">{typeIcon(u.type)}</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-on-surface">{u.title}</h3>
                    <p className="text-[12px] text-outline mt-0.5">
                      {u.publishedAt ? formatDate(u.publishedAt) : 'Draft'} · {formatDate(u.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={u.publishedAt ? 'approved' : 'pending'}>
                  {u.publishedAt ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-[14px] text-on-surface-variant leading-relaxed pl-12">{u.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
