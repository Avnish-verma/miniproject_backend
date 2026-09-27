import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, ShieldCheck, X } from 'lucide-react';
import Button from '../common/Button';

const PERM_PROMPT_KEY = 'shiftaura_notif_prompt_dismissed';

export default function NotificationPermissionModal() {
  const { isSupported, permission, isSubscribed, subscribeToPush, isPending } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    const isDismissed = localStorage.getItem(PERM_PROMPT_KEY) === 'true';
    if (permission === 'default' && !isSubscribed && !isDismissed) {
      // Show polite prompt after user has interacted for a moment
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, isSubscribed]);

  const handleDismiss = () => {
    localStorage.setItem(PERM_PROMPT_KEY, 'true');
    setIsOpen(false);
  };

  const handleEnable = async () => {
    const success = await subscribeToPush();
    if (success) {
      setIsOpen(false);
    } else {
      handleDismiss();
    }
  };

  if (!isOpen || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] dark:bg-[#161616] border border-[#E7E5E2] dark:border-[#292929] rounded-[18px] max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-[12px] bg-[#FF5C35]/10 dark:bg-[#FF5C35]/20 flex items-center justify-center text-[#FF5C35]">
            <Bell className="w-5 h-5 stroke-[2px]" />
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-[#929292] hover:text-[#111111] dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4 stroke-[1.75px]" />
          </button>
        </div>

        <div>
          <h3 className="font-bold text-[17px] text-[#111111] dark:text-[#F5F5F5] leading-tight">
            Stay connected on ShiftAura
          </h3>
          <p className="text-[13px] text-[#6B6B6B] dark:text-[#A0A0A0] mt-1.5 leading-relaxed">
            Get instant background notifications for messages, incoming voice/video calls, and important updates.
          </p>
        </div>

        <div className="space-y-2 text-[12px] text-[#4A4A4A] dark:text-[#B0B0B0] bg-[#FAFAF8] dark:bg-[#0D0D0D] p-3 rounded-[12px] border border-[#E7E5E2]/80 dark:border-[#242424]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C35]" />
            <span>Incoming Audio & Video Calls</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C35]" />
            <span>Direct Messages while in other tabs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C35]" />
            <span>Followers, mentions, and interactions</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={handleEnable}
            disabled={isPending}
            className="flex-1 bg-[#FF5C35] hover:bg-[#FF481F] text-white font-medium"
          >
            {isPending ? 'Enabling...' : 'Enable Notifications'}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={handleDismiss}
            className="text-[#6B6B6B] dark:text-[#A0A0A0]"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
