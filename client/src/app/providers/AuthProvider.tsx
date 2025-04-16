import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/shared/api";
import { useUserStore } from "@/shared/stores/userStore";

type AuthContextType = {
  accessToken: string | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    avatar?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { setUser, clearUser } = useUserStore();

  useEffect(() => {
    const interceptor = apiClient.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    return () => {
      apiClient.interceptors.request.eject(interceptor);
    };
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login", { email, password });
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    avatar?: string;
  }) => {
    const response = await apiClient.post("/auth/register", data);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  };

  const logout = async () => {
    await apiClient.post("/auth/logout");
    setAccessToken(null);
    clearUser();
    queryClient.clear();
  };

  const refreshToken = async () => {
    const refreshResponse = await apiClient.post("/auth/refresh");
    setAccessToken(refreshResponse.data.accessToken);
  };

  useEffect(() => {
    if (!location.pathname.startsWith("/auth")) {
      apiClient
        .post("/auth/refresh")
        .then((res) => {
          const newToken = res.data.accessToken;
          setAccessToken(newToken);
          return apiClient.get("/users/profile", {
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

  useEffect(() => {
    if (!location.pathname.startsWith("/auth")) {
      const interval = setInterval(
        () => refreshToken().catch(() => logout()),
        55 * 60 * 1000,
      );
      return () => clearInterval(interval);
    }
  }, [accessToken, location.pathname]);

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
