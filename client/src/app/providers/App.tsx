import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';

import { ThemeProvider } from '@/shared/theme/theme-provider';
import { LazyPage } from '@/shared/ui/lazy';
import { TooltipProvider } from '@/shared/ui/tooltip';

import { PrivateRoute } from './PrivateRoute';

const Login = lazy(() =>
  import('@/pages/auth/Login').then((module) => ({ default: module.Login })),
);

const SignUp = lazy(() =>
  import('@/pages/auth/SignUp').then((module) => ({ default: module.SignUp })),
);

const ForgotPassword = lazy(() =>
  import('@/pages/auth/ForgotPassword').then((module) => ({
    default: module.ForgotPassword,
  })),
);

const ResetPassword = lazy(() =>
  import('@/pages/auth/ResetPassword').then((module) => ({
    default: module.ResetPassword,
  })),
);

const Home = lazy(() =>
  import('@/pages/home').then((module) => ({ default: module.Home })),
);

const AllTasks = lazy(() =>
  import('@/pages/all-tasks').then((module) => ({
    default: module.AllTasks,
  })),
);

const NotFound = lazy(() =>
  import('@/pages/not-found').then((module) => ({ default: module.NotFound })),
);

const Landing = lazy(() =>
  import('@/pages/landing').then((module) => ({ default: module.Landing })),
);

export const App = () => {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <ThemeProvider defaultTheme="system">
          <TooltipProvider>
            <Routes>
              <Route
                path="/about"
                element={
                  <LazyPage>
                    <Landing />
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
                      <Home />
                    </LazyPage>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <LazyPage>
                      <AllTasks />
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
          </TooltipProvider>
        </ThemeProvider>
      </MotionConfig>
    </LazyMotion>
  );
};
