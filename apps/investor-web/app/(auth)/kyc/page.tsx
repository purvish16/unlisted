'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { kycApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Step = 'pan' | 'aadhaar' | 'aadhaar-otp' | 'bank' | 'done';

export default function KycPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [step, setStep] = useState<Step>('pan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PAN
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [fullName, setFullName] = useState('');

  // Aadhaar
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarRef, setAadhaarRef] = useState('');

  // Bank
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const steps: Step[] = ['pan', 'aadhaar', 'bank', 'done'];
  const stepIndex = steps.indexOf(step === 'aadhaar-otp' ? 'aadhaar' : step);

  const handlePan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase())) {
      setError('Enter a valid PAN (e.g. ABCDE1234F)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await kycApi.verifyPan({ panNumber: pan.toUpperCase(), fullName, dateOfBirth: dob });
      if (res.verified) {
        setStep('aadhaar');
      } else {
        setError('PAN verification failed. Please check details.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAadhaar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(aadhaar)) {
      setError('Enter a valid 12-digit Aadhaar number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await kycApi.initiateAadhaar();
      setAadhaarRef(res.requestId);
      setStep('aadhaar-otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Aadhaar initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAadhaarOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarOtp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await kycApi.completeAadhaar(aadhaarRef);
      if (res.verified) {
        setStep('bank');
      } else {
        setError('Aadhaar OTP verification failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
      setError('Enter a valid account number and IFSC code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await kycApi.verifyBank({ accountNumber, ifscCode: ifsc.toUpperCase(), accountHolderName: accountHolder });
      if (res.verified) {
        setStep('done');
      } else {
        setError('Bank account verification failed. Please check details.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['PAN', 'Aadhaar', 'Bank', 'Done'];

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-floating p-8">
      {/* Progress */}
      {step !== 'done' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                    i < stepIndex
                      ? 'bg-secondary text-white'
                      : i === stepIndex
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-high text-outline'
                  }`}
                >
                  {i < stepIndex ? (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[12px] font-semibold hidden sm:block ${
                    i === stepIndex ? 'text-primary' : i < stepIndex ? 'text-secondary' : 'text-outline'
                  }`}
                >
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < stepIndex ? 'bg-secondary' : 'bg-outline-variant/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAN Step */}
      {step === 'pan' && (
        <>
          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-on-surface">PAN Verification</h2>
            <p className="text-[14px] text-outline mt-1">Required for tax compliance and trading</p>
          </div>
          <form onSubmit={handlePan} className="space-y-4">
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">PAN Number</label>
              <input
                type="text"
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[15px] text-on-surface placeholder:text-outline border-none focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase tracking-widest"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[15px] text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Full Name (as on PAN)</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="RAHUL SHARMA"
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[15px] text-on-surface placeholder:text-outline border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {error && <p className="text-[13px] text-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px] disabled:opacity-60">
              {loading ? 'Verifying…' : 'Verify PAN'}
            </button>
          </form>
        </>
      )}

      {/* Aadhaar Step */}
      {step === 'aadhaar' && (
        <>
          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-on-surface">Aadhaar Verification</h2>
            <p className="text-[14px] text-outline mt-1">Verify your identity with Aadhaar OTP</p>
          </div>
          <form onSubmit={handleAadhaar} className="space-y-4">
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Aadhaar Number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                placeholder="1234 5678 9012"
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[15px] text-on-surface placeholder:text-outline border-none focus:outline-none focus:ring-2 focus:ring-primary/30 tracking-widest"
              />
            </div>
            {error && <p className="text-[13px] text-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px] disabled:opacity-60">
              {loading ? 'Sending OTP…' : 'Send Aadhaar OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep('bank')}
              className="w-full text-center text-[13px] text-outline hover:text-primary transition-colors"
            >
              Skip for now
            </button>
          </form>
        </>
      )}

      {/* Aadhaar OTP Step */}
      {step === 'aadhaar-otp' && (
        <>
          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-on-surface">Aadhaar OTP</h2>
            <p className="text-[14px] text-outline mt-1">Enter the OTP sent to your Aadhaar-linked mobile</p>
          </div>
          <form onSubmit={handleAadhaarOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={aadhaarOtp}
              onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[22px] font-bold tracking-[0.4em] text-center text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            {error && <p className="text-[13px] text-error">{error}</p>}
            <button type="submit" disabled={loading || aadhaarOtp.length !== 6} className="btn-primary w-full py-3 text-[15px] disabled:opacity-60">
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>
        </>
      )}

      {/* Bank Step */}
      {step === 'bank' && (
        <>
          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-on-surface">Bank Account</h2>
            <p className="text-[14px] text-outline mt-1">Add your bank account for withdrawals</p>
          </div>
          <form onSubmit={handleBank} className="space-y-4">
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Account Holder Name</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="As on bank records"
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[15px] text-on-surface placeholder:text-outline border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">Account Number</label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="1234567890"
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[15px] text-on-surface placeholder:text-outline border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">IFSC Code</label>
              <input
                type="text"
                maxLength={11}
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[15px] text-on-surface placeholder:text-outline border-none focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase tracking-widest"
              />
            </div>
            {error && <p className="text-[13px] text-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px] disabled:opacity-60">
              {loading ? 'Verifying…' : 'Verify Bank Account'}
            </button>
          </form>
        </>
      )}

      {/* Done */}
      {step === 'done' && (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-secondary text-[32px]">check_circle</span>
          </div>
          <h2 className="text-[22px] font-bold text-on-surface">KYC Submitted!</h2>
          <p className="text-[14px] text-outline mt-2 mb-6">
            Your KYC is under review. You can start exploring opportunities while we verify your details.
          </p>
          <button
            onClick={() => router.replace('/')}
            className="btn-primary w-full py-3 text-[15px]"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
