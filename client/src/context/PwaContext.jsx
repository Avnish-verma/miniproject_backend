import React, { createContext, useContext, useState, useEffect } from 'react';

const PwaContext = createContext();

export const INSTALL_STATES = {
  INSTALL_AVAILABLE: 'INSTALL_AVAILABLE',
  INSTALL_PENDING: 'INSTALL_PENDING',
  INSTALLED: 'INSTALLED',
  DISMISSED: 'DISMISSED',
  UNAVAILABLE: 'UNAVAILABLE',
};

const DISMISS_KEY = 'shiftaura_pwa_dismissed';

export function PwaProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installState, setInstallState] = useState(INSTALL_STATES.UNAVAILABLE);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setInstallState(INSTALL_STATES.INSTALLED);
      return;
    }

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    const isDismissed = localStorage.getItem(DISMISS_KEY) === 'true';

    // 3. Listen for Chromium beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isDismissed) {
        setInstallState(INSTALL_STATES.DISMISSED);
      } else {
        setInstallState(INSTALL_STATES.INSTALL_AVAILABLE);
      }
    };

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallState(INSTALL_STATES.INSTALLED);
      localStorage.removeItem(DISMISS_KEY);
      console.log('[ShiftAura PWA] App was successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If iOS Safari and not standalone, can offer manual instructions
    if (isIosDevice && !isDismissed) {
      setInstallState(INSTALL_STATES.INSTALL_AVAILABLE);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    setInstallState(INSTALL_STATES.INSTALL_PENDING);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallState(INSTALL_STATES.INSTALLED);
        setDeferredPrompt(null);
        return true;
      } else {
        dismissPrompt();
        return false;
      }
    } catch (err) {
      console.error('[ShiftAura PWA] Install prompt failed:', err);
      return false;
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setInstallState(INSTALL_STATES.DISMISSED);
  };

  const resetDismissal = () => {
    localStorage.removeItem(DISMISS_KEY);
    if (deferredPrompt || isIos) {
      setInstallState(INSTALL_STATES.INSTALL_AVAILABLE);
    }
  };

  return (
    <PwaContext.Provider
      value={{
        installState,
        isInstallable: installState === INSTALL_STATES.INSTALL_AVAILABLE || installState === INSTALL_STATES.DISMISSED,
        isInstalled: installState === INSTALL_STATES.INSTALLED,
        isIos,
        promptInstall,
        dismissPrompt,
        resetDismissal,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export const usePwa = () => useContext(PwaContext);
