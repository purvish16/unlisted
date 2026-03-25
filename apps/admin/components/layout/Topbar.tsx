'use client';

export function Topbar() {
  return (
    <header
      className="sticky top-0 w-full h-16 z-40 flex items-center justify-between px-8 border-b border-outline-variant/10"
      style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-error text-[18px]">admin_panel_settings</span>
        <span className="text-[14px] font-bold text-on-surface">Platform Administration</span>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-outline">
        <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
        All systems operational
      </div>
    </header>
  );
}
