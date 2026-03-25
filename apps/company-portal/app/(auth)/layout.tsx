export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-on-surface tracking-tight">Unlisted</h1>
          <p className="text-[12px] font-bold tracking-[0.08em] uppercase text-primary mt-1">
            Company Portal
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
