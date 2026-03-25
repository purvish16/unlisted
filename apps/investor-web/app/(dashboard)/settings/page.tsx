'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { investorApi, kycApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Badge } from '@/components/shared/Badge';

export default function SettingsPage() {
  const { user } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: investorApi.getProfile,
  });

  const { data: kycStatus } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: kycApi.getStatus,
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'kyc' | 'notifications'>('profile');

  const KYC_LEVELS = [
    { level: 0, label: 'None', icon: 'radio_button_unchecked' },
    { level: 1, label: 'PAN Verified', icon: 'badge' },
    { level: 2, label: 'Aadhaar Verified', icon: 'fingerprint' },
    { level: 3, label: 'Bank Linked', icon: 'account_balance' },
  ];

  const currentLevel = kycStatus?.kycLevel ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Settings</h1>
        <p className="text-[14px] text-outline mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Side tabs */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-2">
            {(['profile', 'kyc', 'notifications'] as const).map((tab) => (
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
                  {tab === 'profile' ? 'person' : tab === 'kyc' ? 'verified_user' : 'notifications'}
                </span>
                {tab === 'kyc' ? 'KYC & Verification' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 space-y-5">
              <h2 className="text-[18px] font-semibold text-on-surface">Profile Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Mobile Number', value: user?.mobile ?? '—' },
                  { label: 'KYC Status', value: user?.kycStatus },
                  { label: 'Full Name', value: profile?.fullName ?? '—' },
                  { label: 'Email', value: profile?.email ?? '—' },
                  { label: 'PAN', value: profile?.panNumber ?? '—' },
                  { label: 'Date of Birth', value: profile?.dateOfBirth ?? '—' },
                ].map((field) => (
                  <div key={field.label} className="bg-surface-container-low rounded-xl p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-1">
                      {field.label}
                    </div>
                    {field.label === 'KYC Status' ? (
                      <Badge variant={field.value === 'complete' ? 'approved' : 'pending'}>
                        {field.value}
                      </Badge>
                    ) : (
                      <div className="text-[14px] font-semibold text-on-surface">{field.value}</div>
                    )}
                  </div>
                ))}
              </div>

              {profile?.bankAccountNumber && (
                <div className="bg-surface-container-low rounded-xl p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">
                    Linked Bank Account
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">account_balance</span>
                    <div>
                      <div className="text-[14px] font-semibold text-on-surface">
                        {profile.bankAccountNumber}
                      </div>
                      <div className="text-[12px] text-outline">{profile.ifscCode}</div>
                    </div>
                    <Badge variant="approved" className="ml-auto">Verified</Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KYC */}
          {activeTab === 'kyc' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 space-y-5">
              <h2 className="text-[18px] font-semibold text-on-surface">KYC & Verification</h2>

              <div className="space-y-3">
                {KYC_LEVELS.slice(1).map((level) => {
                  const done = currentLevel >= level.level;
                  return (
                    <div
                      key={level.level}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        done
                          ? 'bg-secondary/5 border-secondary/20'
                          : 'bg-surface-container-low border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        done ? 'bg-secondary/20' : 'bg-surface-container-high'
                      }`}>
                        <span className={`material-symbols-outlined text-[20px] ${done ? 'text-secondary' : 'text-outline'}`}>
                          {done ? 'check_circle' : level.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className={`text-[14px] font-semibold ${done ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          Level {level.level}: {level.label}
                        </div>
                        <div className="text-[12px] text-outline">
                          {done ? 'Completed' : 'Not yet verified'}
                        </div>
                      </div>
                      {done ? (
                        <Badge variant="approved">Done</Badge>
                      ) : (
                        <a
                          href="/kyc"
                          className="text-primary font-bold text-[13px] px-3 py-1 bg-primary/5 rounded hover:bg-primary/10 transition-colors"
                        >
                          Verify
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-primary/5 rounded-xl p-4 text-[13px] text-primary flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">shield</span>
                <span>
                  Higher KYC levels unlock higher investment limits. Level 3 (full KYC) allows investments up to ₹50 lakhs per company.
                </span>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 space-y-5">
              <h2 className="text-[18px] font-semibold text-on-surface">Notification Preferences</h2>
              <p className="text-[14px] text-outline">Notification settings coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
