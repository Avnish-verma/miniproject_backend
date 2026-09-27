import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const getSocketUrl = () => {
      if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
      if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
      if (typeof window !== 'undefined') {
        const { hostname, origin } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return origin;
        }
      }
      return 'https://miniproject-backend-rdei.onrender.com';
    };

    const socketUrl = getSocketUrl();
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected as user:', user.userId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected');
    });

    socketInstance.on('presence:sync', ({ onlineUserIds }) => {
      if (Array.isArray(onlineUserIds)) {
        setOnlineUserIds(new Set(onlineUserIds));
      }
    });

    socketInstance.on('user:online', ({ _id }) => {
      setOnlineUserIds((prev) => new Set([...prev, _id]));
    });

    socketInstance.on('user:offline', ({ _id }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(_id);
        return next;
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUserIds.has(userId.toString());
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        isUserOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
