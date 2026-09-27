import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nova_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('nova_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/v1/auth/me');
        if (response.data && response.data.data) {
          setUser(response.data.data);
          localStorage.setItem('nova_user', JSON.stringify(response.data.data));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        localStorage.removeItem('nova_token');
        localStorage.removeItem('nova_user');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (userId, password) => {
    const response = await api.post('/api/v1/auth/login', { userId, password });
    const { user: userData, token: accessToken } = response.data.data;

    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('nova_token', accessToken);
    localStorage.setItem('nova_user', JSON.stringify(userData));

    return response.data;
  };

  const register = async ({ fullname, userId, emailId, password }) => {
    const response = await api.post('/api/v1/auth/register', {
      fullname,
      userId,
      emailId,
      password,
    });
    return response.data;
  };

  const verifyOtp = async ({ userId, otp }) => {
    const response = await api.post('/api/v1/auth/verify-otp', { userId, otp });
    const { user: userData, accessToken } = response.data.data;

    if (accessToken) {
      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('nova_token', accessToken);
      localStorage.setItem('nova_user', JSON.stringify(userData));
    }

    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('nova_token');
      localStorage.removeItem('nova_user');
    }
  };

  const updateUser = (data) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      localStorage.setItem('nova_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        verifyOtp,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
