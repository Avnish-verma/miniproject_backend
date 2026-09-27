import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function RegisterPage({ onNavigateLogin }) {
  const { register, verifyOtp } = useAuth();

  const [step, setStep] = useState(1); // 1 = Registration Form, 2 = OTP Verification
  const [fullname, setFullname] = useState('');
  const [userId, setUserId] = useState('');
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullname.trim() || !userId.trim() || !emailId.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register({ fullname, userId, emailId, password });
      setStep(2);
    } catch (err) {
      console.error('Registration failed:', err);
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Registration failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verifyOtp({ userId, otp: Number(otp.trim()) });
    } catch (err) {
      console.error('OTP verification failed:', err);
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Invalid or expired code'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAF8] dark:bg-[#0D0D0D] text-[#111111] dark:text-[#F5F5F5]">
      <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-7 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-[8px] bg-[#111111] dark:bg-[#F5F5F5] text-[#FAFAF8] dark:text-[#111111] flex items-center justify-center shadow-sm">
            <span className="font-extrabold text-[18px] tracking-tight">N</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-[20px] font-bold tracking-tight text-[#111111] dark:text-[#F5F5F5]">
                {step === 1 ? 'Join NOVA' : 'Verify Email'}
              </h1>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C35] dark:bg-[#FF6845]" />
            </div>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-0.5">
              {step === 1
                ? 'Create your privacy-first social profile'
                : `Enter the code sent to ${emailId}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#D64545]/10 border border-[#D64545]/20 text-[#D64545] dark:text-[#E05252] text-[12px] rounded-[8px] text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: Registration Form */
          <form onSubmit={handleRegister} className="space-y-3.5 text-[13px]">
            <div>
              <label className="block text-[#111111] dark:text-[#F5F5F5] mb-1 font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full h-[40px] px-3.5 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#111111] dark:text-[#F5F5F5] mb-1 font-medium">
                Username (Handle)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. alex_m"
                className="w-full h-[40px] px-3.5 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#111111] dark:text-[#F5F5F5] mb-1 font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                placeholder="alex@example.com"
                className="w-full h-[40px] px-3.5 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#111111] dark:text-[#F5F5F5] mb-1 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-[40px] px-3.5 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 ml-1 stroke-[1.75px]" />
            </Button>
          </form>
        ) : (
          /* STEP 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-[13px]">
            <div className="text-center">
              <label className="block text-[#6B6B6B] dark:text-[#A0A0A0] mb-2 font-medium">
                6-Digit Security Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-48 mx-auto text-center tracking-[8px] font-mono text-[20px] h-[46px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] rounded-[9px] text-[#111111] dark:text-[#F5F5F5] outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={isLoading || otp.length < 4}
              isLoading={isLoading}
              className="w-full"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 stroke-[1.75px]" />
              <span>Verify & Continue</span>
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-1.5 text-[12px] text-[#6B6B6B] hover:text-[#111111] dark:hover:text-[#F5F5F5] transition-colors pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[1.75px]" />
              <span>Back to registration</span>
            </button>
          </form>
        )}

        {/* Switch to Login */}
        <div className="text-center pt-2 text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] border-t border-[#E7E5E2]/80 dark:border-[#292929]/80">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="font-semibold text-[#111111] dark:text-[#F5F5F5] hover:underline transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
