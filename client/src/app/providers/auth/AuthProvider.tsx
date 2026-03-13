import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { apiClient } from '@/shared/api';
import { useUserStore } from '@/shared/stores/userStore';

import { AuthContext, AuthContextType } from './AuthContext';

type Props = {
  children: React.ReactNode;
};

type FailedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const initialRefreshAttempted = useRef(false);
  const isRefreshing = useRef(false);
  const failedQueue = useRef<FailedRequest[]>([]);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { setUser, clearUser } = useUserStore();

  const processQueue = (error: unknown, token: string | null) => {
    for (const request of failedQueue.current) {
      if (token) {
        request.resolve(token);
      } else {
        request.reject(error);
      }
    }
    failedQueue.current = [];
  };

  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (
          error.response?.status !== 401 ||
          originalRequest._retry ||
          originalRequest.url === '/auth/refresh' ||
          originalRequest.url === '/auth/login' ||
          originalRequest.url === '/auth/register'
        ) {
          return Promise.reject(error);
        }

        if (isRefreshing.current) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.current.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing.current = true;

        return apiClient
          .post('/auth/refresh')
          .then((res) => {
            const newToken = res.data.accessToken as string;
            setAccessToken(newToken);
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((refreshError) => {
            processQueue(refreshError, null);
            setAccessToken(null);
            clearUser();
            queryClient.clear();
            return Promise.reject(refreshError);
          })
          .finally(() => {
            isRefreshing.current = false;
          });
      },
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, clearUser, queryClient]);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    avatar?: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  };

  const logout = useCallback(async () => {
    await apiClient.post('/auth/logout');
    setAccessToken(null);
    clearUser();
    queryClient.clear();
  }, [clearUser, queryClient]);

  const refreshToken = async () => {
    const refreshResponse = await apiClient.post('/auth/refresh');
    setAccessToken(refreshResponse.data.accessToken);
  };

  useEffect(() => {
    if (!location.pathname.startsWith('/auth')) {
      if (initialRefreshAttempted.current) {
        return;
      }

      initialRefreshAttempted.current = true;

      apiClient
        .post('/auth/refresh')
        .then((res) => {
          const newToken = res.data.accessToken;
          setAccessToken(newToken);
          return apiClient.get('/users/profile', {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        })
        .then((profileRes) => {
          setUser(profileRes.data);
        })
        .catch(() => {
          setAccessToken(null);
          clearUser();
        })
        .finally(() => setIsInitialized(true));
    } else {
      setIsInitialized(true);
    }
  }, [location.pathname, setUser, clearUser]);

  const value: AuthContextType = {
    accessToken,
    isAuthLoading: !isInitialized,
    isAuthenticated: !!accessToken,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
