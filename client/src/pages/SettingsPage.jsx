import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Moon, Sun, Lock, LogOut, Check, CheckCircle2, User, Bell } from 'lucide-react';
import Button from '../components/common/Button';
import api from '../services/api';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isPrivate, setIsPrivate] = useState(user?.privacy?.isPrivate || false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTogglePrivacy = async () => {
    const nextPrivacyState = !isPrivate;
    setIsPrivate(nextPrivacyState);
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await api.put('/api/v1/users/profile', {
        privacy: { ...user?.privacy, isPrivate: nextPrivacyState },
      });
      if (res.data?.data) {
        updateUser(res.data.data);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Update privacy failed:', err);
      setIsPrivate(!nextPrivacyState);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Page Title */}
      <div className="border-b border-[#E7E5E2] dark:border-[#292929] pb-4">
        <h1 className="text-[22px] font-bold text-[#111111] dark:text-[#F5F5F5] tracking-tight">
          Settings
        </h1>
        <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-1">
          Manage your account preferences, privacy visibility, and platform security.
        </p>
      </div>

      {/* 1. Account Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[12px] p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
          <User className="w-4 h-4 text-[#FF5C35] dark:text-[#FF6845] stroke-[1.75px]" />
          <span>Account</span>
        </div>

        <div className="divide-y divide-[#E7E5E2]/60 dark:divide-[#292929]/60 text-[13px]">
          <div className="flex justify-between py-2.5">
            <span className="text-[#6B6B6B] dark:text-[#A0A0A0]">Username</span>
            <span className="font-semibold text-[#111111] dark:text-[#F5F5F5]">
              @{user?.userId}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-[#6B6B6B] dark:text-[#A0A0A0]">Email Address</span>
            <span className="font-semibold text-[#111111] dark:text-[#F5F5F5]">
              {user?.emailId}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-[#6B6B6B] dark:text-[#A0A0A0]">Verification Status</span>
            <span className="inline-flex items-center gap-1 font-medium text-[#16845B] dark:text-[#38A878]">
              <Check className="w-3.5 h-3.5 stroke-[2px]" />
              Verified Profile
            </span>
          </div>
        </div>
      </div>

      {/* 2. Privacy Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[12px] p-5 space-y-4">
        <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
          <Shield className="w-4 h-4 text-[#FF5C35] dark:text-[#FF6845] stroke-[1.75px]" />
          <span>Privacy & Visibility</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="max-w-[80%]">
            <h4 className="font-semibold text-[13px] text-[#111111] dark:text-[#F5F5F5]">
              Private Profile
            </h4>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-0.5 leading-relaxed">
              When enabled, only people you approve can see your posts, media streams, and follower list.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={handleTogglePrivacy}
            disabled={isSaving}
            className={`w-11 h-6 rounded-full transition-colors duration-150 relative focus:outline-none focus:ring-2 focus:ring-[#FF5C35]/30 ${
              isPrivate
                ? 'bg-[#FF5C35] dark:bg-[#FF6845]'
                : 'bg-[#E7E5E2] dark:bg-[#292929]'
            }`}
            aria-label="Toggle private account"
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                isPrivate ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#16845B] dark:text-[#38A878] font-medium pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75px]" />
            <span>Privacy preferences saved</span>
          </div>
        )}
      </div>

      {/* 3. Appearance Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[12px] p-5 space-y-4">
        <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
          {isDark ? (
            <Moon className="w-4 h-4 text-[#FF5C35] dark:text-[#FF6845] stroke-[1.75px]" />
          ) : (
            <Sun className="w-4 h-4 text-[#FF5C35] dark:text-[#FF6845] stroke-[1.75px]" />
          )}
          <span>Appearance</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <h4 className="font-semibold text-[13px] text-[#111111] dark:text-[#F5F5F5]">
              Theme
            </h4>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-0.5">
              Currently using {isDark ? 'Dark Mode' : 'Light Mode'}.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 stroke-[1.75px]" />
            ) : (
              <Moon className="w-3.5 h-3.5 stroke-[1.75px]" />
            )}
            <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
          </Button>
        </div>
      </div>

      {/* 4. Session & Logout */}
      <div className="pt-2">
        <Button
          type="button"
          variant="destructive"
          size="lg"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 stroke-[1.75px]" />
          <span>Log Out of NOVA</span>
        </Button>
      </div>
    </div>
  );
}
