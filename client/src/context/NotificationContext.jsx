import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Check existing subscription
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const sub = await registration.pushManager.getSubscription();
          setIsSubscribed(Boolean(sub));
        } catch {
          setIsSubscribed(false);
        }
      });
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!isSupported || !isAuthenticated) return false;
    setIsPending(true);

    try {
      // 1. Request Browser Permission
      const permResult = await Notification.requestPermission();
      setPermission(permResult);
      if (permResult !== 'granted') {
        setIsPending(false);
        return false;
      }

      // 2. Fetch VAPID Public Key from Backend
      const res = await api.get('/api/v1/push/vapid-public-key');
      const publicKey = res.data?.data?.publicKey;
      if (!publicKey) {
        throw new Error('VAPID public key not received from server');
      }

      // 3. Register with PushManager
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // 4. Send subscription to Backend
      await api.post('/api/v1/push/subscribe', {
        subscription: subscription.toJSON(),
      });

      setIsSubscribed(true);
      console.log('[ShiftAura Push] Successfully subscribed to Web Push');
      return true;
    } catch (err) {
      console.error('[ShiftAura Push] Subscription error:', err);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [isSupported, isAuthenticated]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!isSupported) return false;
    setIsPending(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api.post('/api/v1/push/unsubscribe', { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('[ShiftAura Push] Unsubscribe error:', err);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [isSupported]);

  return (
    <NotificationContext.Provider
      value={{
        isSupported,
        permission,
        isSubscribed,
        isPending,
        subscribeToPush,
        unsubscribeFromPush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
