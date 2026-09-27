import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import BrandLockup from '../components/common/BrandLockup';
import api from '../services/api';

export default function LoginPage({ onNavigateRegister }) {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Please provide your username and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(userId.trim(), password);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Invalid username or password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      const res = await api.post('/api/v1/auth/forgot-password', { userId: forgotEmail.trim() });
      setForgotMsg(res.data?.message || 'Check your inbox for a reset link.');
    } catch (err) {
      setForgotMsg(err.response?.data?.error?.message || 'Failed to send reset link.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAF8] dark:bg-[#0D0D0D] text-[#111111] dark:text-[#F5F5F5]">
      <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-7 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <BrandLockup size="lg" layout="vertical" />
          <h2 className="text-[13px] font-medium text-[#6B6B6B] dark:text-[#A0A0A0] pt-2">
            Sign in to continue
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-[#D64545]/10 border border-[#D64545]/20 text-[#D64545] dark:text-[#E05252] text-[12px] rounded-[8px] text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
          <div>
            <label className="block text-[#111111] dark:text-[#F5F5F5] mb-1.5 font-medium">
              Username or Email
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. alice_chen"
              autoComplete="username"
              className="w-full h-[40px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] rounded-[9px] px-3.5 text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[#111111] dark:text-[#F5F5F5] font-medium">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[11px] text-[#6B6B6B] hover:text-[#111111] dark:text-[#A0A0A0] dark:hover:text-[#F5F5F5] transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full h-[40px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] rounded-[9px] px-3.5 text-[14px] text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070] outline-none transition-colors"
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

        {/* Switch to Register */}
        <div className="text-center pt-1 text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0]">
          <span>Don't have an account? </span>
          <button
            type="button"
            onClick={onNavigateRegister}
            className="font-semibold text-[#111111] dark:text-[#F5F5F5] hover:underline transition-colors"
          >
            Create account
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-6 w-full max-w-sm shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5]">
                Reset Password
              </h3>
              <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-1">
                Enter your username or email address and we will send you a password recovery link.
              </p>
            </div>

            {forgotMsg && (
              <p className="p-2.5 text-[12px] bg-[#F4F3F0] dark:bg-[#1C1C1C] border border-[#E7E5E2] dark:border-[#292929] text-[#111111] dark:text-[#F5F5F5] rounded-[8px]">
                {forgotMsg}
              </p>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3 text-[13px]">
              <input
                type="text"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Username or email address"
                className="w-full h-[40px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] focus:border-[#FF5C35] dark:focus:border-[#FF6845] rounded-[9px] px-3.5 text-[14px] text-[#111111] dark:text-[#F5F5F5] outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgot(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="accent" size="sm">
                  Send Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
