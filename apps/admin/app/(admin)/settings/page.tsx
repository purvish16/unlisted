'use client';

export default function AdminSettingsPage() {
  const CONFIG_ITEMS = [
    { label: 'Platform Fee Rate', value: '2%', desc: 'Charged on every secondary trade' },
    { label: 'Max Primary Raise', value: '₹50 Cr', desc: 'Per company per fundraising round' },
    { label: 'KYC L3 Investment Cap', value: '₹50 L', desc: 'Max investment per company (full KYC)' },
    { label: 'KYC L1 Investment Cap', value: '₹1 L', desc: 'Max investment per company (PAN only)' },
    { label: 'OTP Expiry', value: '5 minutes', desc: 'OTP validity window' },
    { label: 'JWT Access Token', value: '15 minutes', desc: 'Access token lifetime' },
    { label: 'JWT Refresh Token', value: '30 days', desc: 'Refresh token lifetime' },
    { label: 'Settlement T+', value: 'T+2', desc: 'Settlement period after trade execution' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Platform Settings</h1>
        <p className="text-[14px] text-outline mt-1">
          Core platform configuration — changes require deployment
        </p>
      </div>

      <div className="bg-error/5 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0 mt-0.5">warning</span>
        <div className="text-[13px] text-error">
          <strong>Production config</strong> — These values are set at the infrastructure level.
          Contact your DevOps team to change platform-wide settings.
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="p-5 border-b border-surface-container-low">
          <h2 className="text-[16px] font-semibold text-on-surface">Current Configuration</h2>
        </div>
        <div className="divide-y divide-surface-container-low">
          {CONFIG_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[14px] font-semibold text-on-surface">{item.label}</p>
                <p className="text-[12px] text-outline">{item.desc}</p>
              </div>
              <div className="text-[14px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg font-mono">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 space-y-4">
        <h2 className="text-[16px] font-semibold text-on-surface">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'API Server', status: 'Operational', port: '4000' },
            { label: 'PostgreSQL', status: 'Connected', port: '5432' },
            { label: 'Redis', status: 'Connected', port: '6379' },
          ].map((sys) => (
            <div key={sys.label} className="bg-surface-container-low rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-[12px] font-bold uppercase tracking-wider text-outline">{sys.label}</span>
              </div>
              <div className="text-[15px] font-semibold text-on-surface">{sys.status}</div>
              <div className="text-[11px] text-outline">:{sys.port}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
