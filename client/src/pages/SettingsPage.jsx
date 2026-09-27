import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePwa } from '../context/PwaContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import {
  Shield,
  Moon,
  Sun,
  Lock,
  LogOut,
  Check,
  CheckCircle2,
  User,
  Bell,
  Volume2,
  VolumeX,
  Smartphone,
  Info,
  Download,
  MessageSquare,
  PhoneCall,
  Heart,
  Vibrate,
  AlertCircle,
} from 'lucide-react';
import Button from '../components/common/Button';
import api from '../services/api';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, promptInstall, resetDismissal } = usePwa();
  const { isSupported: pushSupported, permission, isSubscribed, subscribeToPush, unsubscribeFromPush, isPending: pushPending } = useNotifications();
  const toast = useToast();

  const [isPrivate, setIsPrivate] = useState(user?.privacy?.isPrivate || false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Granular Notification settings
  const [notifMessages, setNotifMessages] = useState(
    () => localStorage.getItem('shiftaura_notif_messages') !== 'false'
  );
  const [notifCalls, setNotifCalls] = useState(
    () => localStorage.getItem('shiftaura_notif_calls') !== 'false'
  );
  const [notifSocial, setNotifSocial] = useState(
    () => localStorage.getItem('shiftaura_notif_social') !== 'false'
  );
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('shiftaura_sound_enabled') !== 'false'
  );
  const [vibrationEnabled, setVibrationEnabled] = useState(
    () => localStorage.getItem('shiftaura_vibration_enabled') !== 'false'
  );

  const handleToggleMessages = () => {
    const next = !notifMessages;
    setNotifMessages(next);
    localStorage.setItem('shiftaura_notif_messages', String(next));
    if (toast?.info) toast.info(next ? 'Message alerts enabled' : 'Message alerts muted');
  };

  const handleToggleCalls = () => {
    const next = !notifCalls;
    setNotifCalls(next);
    localStorage.setItem('shiftaura_notif_calls', String(next));
    if (toast?.info) toast.info(next ? 'Call alerts enabled' : 'Call alerts muted');
  };

  const handleToggleSocial = () => {
    const next = !notifSocial;
    setNotifSocial(next);
    localStorage.setItem('shiftaura_notif_social', String(next));
    if (toast?.info) toast.info(next ? 'Social notifications enabled' : 'Social notifications muted');
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('shiftaura_sound_enabled', String(next));
    if (toast?.info) toast.info(next ? 'Notification sounds enabled' : 'Notification sounds muted');
  };

  const handleToggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    localStorage.setItem('shiftaura_vibration_enabled', String(next));
    if (toast?.info) toast.info(next ? 'Haptic vibration enabled' : 'Haptic vibration disabled');
  };

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
        if (toast?.success) {
          toast.success('Privacy preferences updated');
        }
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Update privacy failed:', err);
      setIsPrivate(!nextPrivacyState);
      if (toast?.error) {
        toast.error('Failed to update privacy settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      const ok = await unsubscribeFromPush();
      if (ok && toast?.info) toast.info('Push notifications disabled');
    } else {
      const ok = await subscribeToPush();
      if (ok && toast?.success) toast.success('Push notifications enabled!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 px-4 select-none">
      {/* Page Title */}
      <div className="border-b border-[#E7E5E2] dark:border-[#292929] pb-4 pt-2">
        <h1 className="text-[22px] font-bold text-[#111111] dark:text-[#F5F5F5] tracking-tight">
          Settings
        </h1>
        <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-1">
          Manage your account preferences, notifications, audio, and application installation.
        </p>
      </div>

      {/* 1. Account Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
          <User className="w-4 h-4 text-[#FF5C35] stroke-[2px]" />
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

      {/* 2. PWA Application Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
          <Smartphone className="w-4 h-4 text-[#FF5C35] stroke-[2px]" />
          <span>Application Experience</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="max-w-[75%]">
            <h4 className="font-semibold text-[13px] text-[#111111] dark:text-[#F5F5F5]">
              {isInstalled ? 'ShiftAura is installed' : 'Install ShiftAura App'}
            </h4>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-0.5 leading-relaxed">
              {isInstalled
                ? 'Running as a standalone native-feeling application with background support.'
                : 'Install ShiftAura directly onto your device for faster startup, calls, and notifications.'}
            </p>
          </div>

          {isInstalled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16845B]/15 text-[#16845B] dark:text-[#38A878] text-[12px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2px]" />
              Installed
            </span>
          ) : isInstallable ? (
            <Button
              variant="primary"
              size="sm"
              onClick={promptInstall}
              className="flex items-center gap-1.5 bg-[#FF5C35] hover:bg-[#FF481F]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </Button>
          ) : (
            <span className="text-[12px] text-[#808080]">Available on browser</span>
          )}
        </div>
      </div>

      {/* 3. Notifications Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
            <Bell className="w-4 h-4 text-[#FF5C35] stroke-[2px]" />
            <span>Notifications</span>
          </div>

          {/* Status Display: ● Enabled or ○ Disabled */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0]">Push notifications:</span>
            {isSubscribed && permission === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#16845B]/15 text-[#16845B] dark:text-[#38A878] text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16845B] dark:bg-[#38A878]" />
                ● Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#808080]/15 text-[#808080] text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#808080]" />
                ○ Disabled
              </span>
            )}
          </div>
        </div>

        {/* Master Push Toggle Button */}
        <div className="flex items-center justify-between pt-1 pb-2 border-b border-[#E7E5E2]/60 dark:border-[#292929]/60">
          <div className="max-w-[75%]">
            <h4 className="font-semibold text-[13px] text-[#111111] dark:text-[#F5F5F5]">
              Background Web Push Service
            </h4>
            <p className="text-[12px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-0.5 leading-relaxed">
              Allow ShiftAura to wake your device for calls and messages when the app is in the background or closed.
            </p>
          </div>

          {pushSupported ? (
            <Button
              variant={isSubscribed ? 'outline' : 'primary'}
              size="sm"
              disabled={pushPending || permission === 'denied'}
              onClick={handleTogglePush}
              className={isSubscribed ? '' : 'bg-[#FF5C35] hover:bg-[#FF481F] text-white'}
            >
              {pushPending ? 'Updating...' : isSubscribed ? 'Disable' : 'Enable'}
            </Button>
          ) : (
            <span className="text-[12px] text-[#808080]">Not supported on this browser</span>
          )}
        </div>

        {/* Permission Denied Explanation Banner */}
        {permission === 'denied' && (
          <div className="p-3.5 rounded-[12px] bg-[#D64545]/10 border border-[#D64545]/20 text-[12px] text-[#D64545] dark:text-[#E05252] space-y-1.5 animate-in fade-in duration-200">
            <div className="font-bold flex items-center gap-1.5 text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Push notifications are blocked in your browser</span>
            </div>
            <p className="leading-relaxed text-[#4A4A4A] dark:text-[#D0D0D0] text-[12px]">
              Browser security prevents websites from asking for permission once blocked. To receive call and message alerts:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-[#5A5A5A] dark:text-[#B0B0B0] pl-1">
              <li>Click the lock or site settings icon next to <strong>https://social.shiftaura.in</strong> in your address bar.</li>
              <li>Find <strong>Notifications</strong> and change it from <em>Block</em> to <em>Allow</em>.</li>
              <li>Reload ShiftAura to complete setup.</li>
            </ol>
          </div>
        )}

        {/* Granular Sub-Toggles Hierarchy */}
        <div className="space-y-3.5 pt-1 text-[13px]">
          {/* 1. Messages */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-[#FF5C35] stroke-[1.75px]" />
              <div>
                <h5 className="font-semibold text-[#111111] dark:text-[#F5F5F5]">Messages</h5>
                <p className="text-[11.5px] text-[#6B6B6B] dark:text-[#A0A0A0]">Direct message previews and chat alerts</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifMessages}
              onClick={handleToggleMessages}
              className={`w-10 h-5 rounded-full transition-colors duration-150 relative focus:outline-none ${
                notifMessages ? 'bg-[#FF5C35]' : 'bg-[#E7E5E2] dark:bg-[#292929]'
              }`}
              aria-label="Toggle message notifications"
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${notifMessages ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* 2. Calls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-[#FF5C35] stroke-[1.75px]" />
              <div>
                <h5 className="font-semibold text-[#111111] dark:text-[#F5F5F5]">Calls</h5>
                <p className="text-[11.5px] text-[#6B6B6B] dark:text-[#A0A0A0]">Incoming audio/video calls and missed call alerts</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifCalls}
              onClick={handleToggleCalls}
              className={`w-10 h-5 rounded-full transition-colors duration-150 relative focus:outline-none ${
                notifCalls ? 'bg-[#FF5C35]' : 'bg-[#E7E5E2] dark:bg-[#292929]'
              }`}
              aria-label="Toggle call notifications"
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${notifCalls ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* 3. Social activity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-[#FF5C35] stroke-[1.75px]" />
              <div>
                <h5 className="font-semibold text-[#111111] dark:text-[#F5F5F5]">Social activity</h5>
                <p className="text-[11.5px] text-[#6B6B6B] dark:text-[#A0A0A0]">Likes, comments, mentions, and new followers</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifSocial}
              onClick={handleToggleSocial}
              className={`w-10 h-5 rounded-full transition-colors duration-150 relative focus:outline-none ${
                notifSocial ? 'bg-[#FF5C35]' : 'bg-[#E7E5E2] dark:bg-[#292929]'
              }`}
              aria-label="Toggle social activity notifications"
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${notifSocial ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* 4. Sounds */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-[#FF5C35] stroke-[1.75px]" />
              <div>
                <h5 className="font-semibold text-[#111111] dark:text-[#F5F5F5]">Sounds</h5>
                <p className="text-[11.5px] text-[#6B6B6B] dark:text-[#A0A0A0]">Audio chimes for calls and message alerts</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={handleToggleSound}
              className={`w-10 h-5 rounded-full transition-colors duration-150 relative focus:outline-none ${
                soundEnabled ? 'bg-[#FF5C35]' : 'bg-[#E7E5E2] dark:bg-[#292929]'
              }`}
              aria-label="Toggle notification sounds"
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* 5. Vibration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Vibrate className="w-4 h-4 text-[#FF5C35] stroke-[1.75px]" />
              <div>
                <h5 className="font-semibold text-[#111111] dark:text-[#F5F5F5]">Vibration</h5>
                <p className="text-[11.5px] text-[#6B6B6B] dark:text-[#A0A0A0]">Haptic feedback pattern for calls and alerts</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={vibrationEnabled}
              onClick={handleToggleVibration}
              className={`w-10 h-5 rounded-full transition-colors duration-150 relative focus:outline-none ${
                vibrationEnabled ? 'bg-[#FF5C35]' : 'bg-[#E7E5E2] dark:bg-[#292929]'
              }`}
              aria-label="Toggle vibration feedback"
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${vibrationEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Privacy Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
          <Shield className="w-4 h-4 text-[#FF5C35] stroke-[2px]" />
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
            className={`w-11 h-6 rounded-full transition-colors duration-150 relative focus:outline-none ${
              isPrivate ? 'bg-[#FF5C35]' : 'bg-[#E7E5E2] dark:bg-[#292929]'
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
      </div>

      {/* 6. Appearance Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
          {isDark ? (
            <Moon className="w-4 h-4 text-[#FF5C35] stroke-[2px]" />
          ) : (
            <Sun className="w-4 h-4 text-[#FF5C35] stroke-[2px]" />
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

      {/* 7. About ShiftAura Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[14px] p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-[#111111] dark:text-[#F5F5F5] font-semibold text-[14px]">
          <Info className="w-4 h-4 text-[#FF5C35] stroke-[2px]" />
          <span>About ShiftAura</span>
        </div>

        <div className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] space-y-1.5">
          <p className="font-semibold text-[#111111] dark:text-[#F5F5F5]">
            ShiftAura Social Communication Platform
          </p>
          <p className="text-[12px]">Version 1.0.0 (Production Release)</p>
          <p className="text-[12px] text-[#808080]">
            Equipped with WebRTC End-to-End Voice & Video Calling, Realtime Socket.IO Messaging, Web Push Background Notifications, and PWA Standalone Support.
          </p>
        </div>
      </div>

      {/* 8. Session & Logout */}
      <div className="pt-2">
        <Button
          type="button"
          variant="destructive"
          size="lg"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-[#D64545] hover:bg-[#B83838] text-white"
        >
          <LogOut className="w-4 h-4 stroke-[1.75px]" />
          <span>Log Out of ShiftAura</span>
        </Button>
      </div>
    </div>
  );
}
