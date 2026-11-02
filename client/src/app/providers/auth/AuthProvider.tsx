import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from '@/shared/api';
import { UserProfile, useUserStore } from '@/shared/stores/userStore';

import { AuthContext, AuthContextType } from './AuthContext';

type Props = { children: React.ReactNode };
type AuthResponse = { accessToken: string; user: UserProfile };
type RefreshRequest = { epoch: number; promise: Promise<string> };

const sessionChanged = () =>
  new Error('Session changed. Please sign in again.');
const currentEpoch = () => useUserStore.getState().sessionVersion;

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const initialRefreshAttempted = useRef(false);
  const refreshing = useRef<RefreshRequest | null>(null);
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const { setUser, clearUser } = useUserStore();

  const endSession = useCallback(() => {
    tokenRef.current = null;
    setAccessToken(null);
    clearUser();
    queryClient.clear();
  }, [clearUser, queryClient]);

  const refreshAccess = useCallback((): Promise<string> => {
    const epoch = currentEpoch();
    if (refreshing.current?.epoch === epoch) return refreshing.current.promise;
    const promise = apiClient
      .post<{ accessToken: string }>('/auth/refresh')
      .then(({ data }) => {
        if (currentEpoch() !== epoch) throw sessionChanged();
        tokenRef.current = data.accessToken;
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch((error: unknown) => {
        if (currentEpoch() === epoch) endSession();
        throw error;
      })
      .finally(() => {
        if (refreshing.current?.promise === promise) refreshing.current = null;
      });
    refreshing.current = { epoch, promise };
    return promise;
  }, [endSession]);

  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use((config) => {
      if (config._authEpoch === undefined || config._authEpoch === null) {
        config._authEpoch = currentEpoch();
      }
      if (config._authEpoch !== currentEpoch()) throw sessionChanged();
      if (tokenRef.current && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error: ApiError) => {
        const config = error.config;
        if (
          !config ||
          error.status !== 401 ||
          config._retry ||
          config.url.startsWith('/auth/') ||
          config.signal?.aborted ||
          config._authEpoch !== currentEpoch()
        )
          throw error;
        config._retry = true;
        const token = await refreshAccess();
        if (config._authEpoch !== currentEpoch() || config.signal?.aborted)
          throw sessionChanged();
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
        return apiClient.request(config);
      },
    );
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccess]);

  const authenticate = async (url: string, body: unknown) => {
    endSession();
    const epoch = currentEpoch();
    const { data } = await apiClient.post<AuthResponse>(url, body);
    if (currentEpoch() !== epoch) throw sessionChanged();
    tokenRef.current = data.accessToken;
    setAccessToken(data.accessToken);
    setUser(data.user);
  };
  const login = (email: string, password: string) =>
    authenticate('/auth/login', { email, password });
  const register: AuthContextType['register'] = (data) =>
    authenticate('/auth/register', data);
  const logout = async () => {
    const token = tokenRef.current;
    endSession();
    await apiClient.post('/auth/logout', undefined, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };
  const refreshToken = async () => {
    await refreshAccess();
  };

  useEffect(() => {
    if (pathname.startsWith('/auth')) {
      setIsInitialized(true);
      return;
    }
    if (initialRefreshAttempted.current) return;
    initialRefreshAttempted.current = true;
    if (tokenRef.current) {
      setIsInitialized(true);
      return;
    }
    const epoch = currentEpoch();
    refreshAccess()
      .then((token) =>
        apiClient.get<UserProfile>('/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
          _authEpoch: epoch,
        }),
      )
      .then(({ data }) => {
        if (currentEpoch() === epoch) setUser(data);
      })
      .catch(() => {
        if (currentEpoch() === epoch) endSession();
      })
      .finally(() => setIsInitialized(true));
  }, [pathname, setUser, endSession, refreshAccess]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthLoading: !isInitialized,
        isAuthenticated: !!accessToken,
        login,
        register,
        logout,
        endSession,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
