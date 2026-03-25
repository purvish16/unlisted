'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Step = 'mobile' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(mobile);
      setStep('otp');
      startResendTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(mobile, otp);
      if (res.user.role !== 'company_admin') {
        setError('This portal is for company admins only. Please use the investor portal.');
        return;
      }
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-floating p-8">
      {step === 'mobile' ? (
        <>
          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-on-surface">Company Admin Login</h2>
            <p className="text-[14px] text-outline mt-1">Sign in to manage your company listing</p>
          </div>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">
                Mobile Number
              </label>
              <div className="flex items-center gap-3 bg-surface-container-high px-4 py-3 rounded-xl focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                <span className="text-[14px] font-semibold text-on-surface-variant">+91</span>
                <div className="w-px h-5 bg-outline-variant/30" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="flex-1 bg-transparent border-none focus:outline-none text-[15px] text-on-surface placeholder:text-outline"
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="text-[13px] text-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px] disabled:opacity-60">
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={() => { setStep('mobile'); setOtp(''); setError(''); }}
              className="flex items-center gap-1.5 text-[13px] text-outline hover:text-primary transition-colors mb-4"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Change number
            </button>
            <h2 className="text-[22px] font-bold text-on-surface">Verify OTP</h2>
            <p className="text-[14px] text-outline mt-1">
              Sent to <span className="font-semibold text-on-surface">+91 {mobile}</span>
            </p>
          </div>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[22px] font-bold tracking-[0.4em] text-center text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              autoFocus
            />
            {error && <p className="text-[13px] text-error">{error}</p>}
            <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3 text-[15px] disabled:opacity-60">
              {loading ? 'Verifying…' : 'Verify & Login'}
            </button>
          </form>
          <div className="text-center mt-4">
            {resendTimer > 0 ? (
              <p className="text-[13px] text-outline">Resend in <span className="font-semibold text-on-surface">{resendTimer}s</span></p>
            ) : (
              <button
                onClick={async () => {
                  setLoading(true);
                  try { await authApi.sendOtp(mobile); startResendTimer(); }
                  catch { /* ignore */ }
                  finally { setLoading(false); }
                }}
                className="text-[13px] text-primary font-semibold hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
