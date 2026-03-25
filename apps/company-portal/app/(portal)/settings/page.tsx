'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { Badge } from '@/components/shared/Badge';

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'members'>('profile');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: company, isLoading } = useQuery({
    queryKey: ['my-company'],
    queryFn: companyApi.getMyCompany,
  });

  const { data: members } = useQuery({
    queryKey: ['company-members'],
    queryFn: companyApi.getMembers,
    enabled: activeTab === 'members',
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    website: '',
    sector: '',
    foundedYear: '',
  });

  // Sync form when company loads
  useState(() => {
    if (company) {
      setForm({
        name: company.name ?? '',
        description: company.description ?? '',
        website: company.website ?? '',
        sector: company.sector ?? '',
        foundedYear: company.foundedYear ? String(company.foundedYear) : '',
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      companyApi.updateProfile({
        name: form.name,
        description: form.description || undefined,
        website: form.website || undefined,
        sector: form.sector || undefined,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      } as any),
    onSuccess: () => {
      setSuccess('Company profile updated!');
      qc.invalidateQueries({ queryKey: ['my-company'] });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Update failed');
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Settings</h1>
        <p className="text-[14px] text-outline mt-1">Manage your company profile and team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-2">
            {(['profile', 'members'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-surface-container-low text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {tab === 'profile' ? 'apartment' : 'group'}
                </span>
                {tab === 'profile' ? 'Company Profile' : 'Team Members'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-on-surface">Company Profile</h2>
                {company && (
                  <Badge variant={company.listingStatus === 'live' ? 'live' : company.listingStatus === 'approved' ? 'approved' : 'pending'}>
                    {company.listingStatus}
                  </Badge>
                )}
              </div>

              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-surface-container-high rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Read-only fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'CIN', value: company?.cin },
                      { label: 'PAN', value: company?.pan },
                      { label: 'GSTIN', value: company?.gstin },
                      { label: 'Face Value', value: company?.faceValue != null ? `₹${(company.faceValue / 100).toFixed(2)}` : '—' },
                    ].map((f) => (
                      <div key={f.label} className="bg-surface-container-low rounded-xl p-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1">{f.label}</div>
                        <div className="text-[14px] font-semibold text-on-surface font-mono">{f.value ?? '—'}</div>
                      </div>
                    ))}
                  </div>

                  {/* Editable fields */}
                  {success && (
                    <div className="bg-secondary/10 text-secondary text-[13px] font-semibold rounded-xl px-4 py-3">
                      {success}
                    </div>
                  )}
                  {error && <p className="text-[13px] text-error">{error}</p>}

                  <div className="space-y-4">
                    {[
                      { key: 'name',        label: 'Company Name',  type: 'text' },
                      { key: 'sector',      label: 'Sector',        type: 'text' },
                      { key: 'website',     label: 'Website',       type: 'url' },
                      { key: 'foundedYear', label: 'Founded Year',  type: 'number' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">{f.label}</label>
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[14px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>
                    <button
                      onClick={() => { setSuccess(''); setError(''); updateMutation.mutate(); }}
                      disabled={updateMutation.isPending}
                      className="btn-primary py-3 px-8 text-[14px] disabled:opacity-60"
                    >
                      {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-on-surface">Team Members</h2>
                <button className="btn-primary text-[13px] py-2 px-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  Invite Member
                </button>
              </div>
              {!members?.length ? (
                <p className="text-[14px] text-outline text-center py-8">No team members yet.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-[12px] font-bold text-on-primary-fixed flex-shrink-0">
                        {(m.user.fullName ?? m.user.mobile).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-on-surface truncate">
                          {m.user.fullName ?? m.user.mobile}
                        </p>
                        <p className="text-[12px] text-outline">{m.title ?? m.role}</p>
                      </div>
                      <Badge variant="approved">{m.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
