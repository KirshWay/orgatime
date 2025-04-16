import React, { lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion as m } from "motion/react";

import { ThemeProvider } from "@/shared/theme/theme-provider";
import { LazyPage } from "@/shared/ui/lazy";

import { PrivateRoute } from "./PrivateRoute";

const Login = lazy(() =>
  import("@/pages/auth/Login").then((module) => ({ default: module.Login })),
);

const SignUp = lazy(() =>
  import("@/pages/auth/SignUp").then((module) => ({ default: module.SignUp })),
);

const ForgotPassword = lazy(() =>
  import("@/pages/auth/ForgotPassword").then((module) => ({
    default: module.ForgotPassword,
  })),
);

const ResetPassword = lazy(() =>
  import("@/pages/auth/ResetPassword").then((module) => ({
    default: module.ResetPassword,
  })),
);

const Home = lazy(() =>
  import("@/pages/home").then((module) => ({ default: module.Home })),
);

const NotFound = lazy(() =>
  import("@/pages/not-found").then((module) => ({ default: module.NotFound })),
);

const Landing = lazy(() =>
  import("@/pages/landing").then((module) => ({ default: module.Landing })),
);

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <m.div
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 50 }}
    transition={{ duration: 0.4 }}
  >
    {children}
  </m.div>
);

export const App = () => {
  const location = useLocation();

  return (
    <ThemeProvider defaultTheme="system">
      <AnimatePresence mode="sync">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/about"
            element={
              <LazyPage>
                <PageTransition>
                  <Landing />
                </PageTransition>
              </LazyPage>
            }
          />
          <Route
            path="auth/login"
            element={
              <LazyPage>
                <Login />
              </LazyPage>
            }
          />
          <Route
            path="auth/signup"
            element={
              <LazyPage>
                <SignUp />
              </LazyPage>
            }
          />
          <Route
            path="auth/forgot-password"
            element={
              <LazyPage>
                <ForgotPassword />
              </LazyPage>
            }
          />
          <Route
            path="auth/reset-password"
            element={
              <LazyPage>
                <ResetPassword />
              </LazyPage>
            }
          />

          <Route element={<PrivateRoute />}>
            <Route
              path="/"
              element={
                <LazyPage>
                  <PageTransition>
                    <Home />
                  </PageTransition>
                </LazyPage>
              }
            />
          </Route>

          <Route
            path="*"
            element={
              <LazyPage>
                <NotFound />
              </LazyPage>
            }
          />
        </Routes>
      </AnimatePresence>
    </ThemeProvider>
  );
};
