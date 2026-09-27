import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../services/api';

export default function ResetPasswordPage({ onNavigateLogin }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Extract token from query params or URL path
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('token');
    if (queryToken) {
      setToken(queryToken);
    } else {
      const parts = window.location.pathname.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== 'reset-password') {
        setToken(lastPart);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post(`/api/v1/auth/reset-password/${token}`, {
        password: password.trim(),
      });
      setIsSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Invalid or expired reset link. Please request a new one.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#FAFAF8] dark:bg-[#0D0D0D] text-[#111111] dark:text-[#F5F5F5] select-none">
      <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#161616] border border-[#E7E5E2] dark:border-[#292929] rounded-[20px] p-6 sm:p-8 shadow-xl space-y-6">
        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FF6845] to-[#FF3815] flex items-center justify-center shadow-lg text-white mb-1">
            <Lock className="w-6 h-6 stroke-[2px]" />
          </div>
          <h2 className="text-[22px] font-bold tracking-tight text-[#111111] dark:text-[#F5F5F5]">
            Reset Password
          </h2>
          <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0]">
            Enter your new secure password for ShiftAura.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-[12px] bg-[#16845B]/10 dark:bg-[#16845B]/20 text-[#16845B] dark:text-[#38A878] flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 stroke-[2px]" />
              <p className="text-[14px] font-bold">Password Reset Successfully!</p>
              <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0]">
                You can now log in using your new credentials.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={onNavigateLogin}
              className="w-full bg-[#FF5C35] hover:bg-[#FF481F]"
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[10px] bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] dark:text-[#E05252] text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[2px]" />
                <span>{error}</span>
              </div>
            )}

            {!token && (
              <div className="p-3 rounded-[10px] bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] dark:text-[#E05252] text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[2px]" />
                <span>No reset token detected in the URL. Please click the exact link from your email.</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[12px] font-medium text-[#6B6B6B] dark:text-[#A0A0A0]">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || !token}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-medium text-[#6B6B6B] dark:text-[#A0A0A0]">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || !token}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading || !token}
              className="w-full bg-[#FF5C35] hover:bg-[#FF481F] flex items-center justify-center gap-2 mt-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Resetting Password...' : 'Save New Password'}</span>
            </Button>

            <button
              type="button"
              onClick={onNavigateLogin}
              className="w-full flex items-center justify-center gap-1.5 text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-white pt-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2px]" />
              <span>Back to Login</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
