import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="bg-[#D64545] text-white text-[12px] font-medium py-1 px-4 text-center flex items-center justify-center gap-1.5 sticky top-0 z-[110] shadow-sm animate-in fade-in duration-200">
        <WifiOff className="w-3.5 h-3.5 stroke-[2px]" />
        <span>You are currently offline. Changes will automatically sync when reconnected.</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="bg-[#16845B] text-white text-[12px] font-medium py-1 px-4 text-center flex items-center justify-center gap-1.5 sticky top-0 z-[110] shadow-sm animate-in fade-in duration-200">
        <Wifi className="w-3.5 h-3.5 stroke-[2px]" />
        <span>Back online — connection restored.</span>
      </div>
    );
  }

  return null;
}
