import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useUserStore } from "@/shared/stores/userStore";
import { LoadingFallback } from "@/shared/ui/loading";

import { useAuth } from "./auth";

export const PrivateRoute: React.FC = () => {
  const { user } = useUserStore();
  const { isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
