import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

import { useAuth } from '@/app/providers';
import { useAvatar } from '@/shared/hooks/useAvatar';
import { useUserStore } from '@/shared/stores/userStore';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { OptimizedImage } from '@/shared/ui/optimized-image';
import { SEO } from '@/shared/ui/seo';

import { FeatureCards, TiltCard } from './components';

export const Landing = () => {
  const { isAuthenticated, logout } = useAuth();
  const { user } = useUserStore();
  const { url: avatarUrl } = useAvatar();

  const features = [
    {
      title: 'Weekly planning',
      description:
        'See your week at a glance and drag tasks between days as plans change.',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
    },
    {
      title: 'Task management',
      description:
        'Break tasks into subtasks and check them off as you make progress.',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
    },
    {
      title: 'Color marking',
      description:
        'Give tasks a color to make related work easier to spot in your planner.',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      ),
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      <SEO
        title="OrgaTime - Manager of your time"
        description="OrgaTime helps you effectively organize your week using an intuitive task management system."
        keywords="task management, weekly planner, productivity, time management"
        canonicalUrl={`${import.meta.env.VITE_SITE_DOMAIN}/about`}
      />

      <header className="w-full py-4 px-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center">
          <OptimizedImage
            src="/icon.png"
            alt="OrgaTime logo"
            className="h-12 w-12 mr-3"
          />

          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            OrgaTime
          </p>
        </div>
        <nav>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  aria-label="Account menu"
                  className="w-10 h-10 p-0 rounded-full overflow-hidden"
                >
                  {avatarUrl ? (
                    <div className="relative h-8 w-8 overflow-hidden rounded-full">
                      <OptimizedImage
                        src={avatarUrl}
                        alt="User avatar"
                        className="h-full w-full"
                        objectFit="cover"
                        isAvatar
                      />
                    </div>
                  ) : (
                    <User className="w-full h-full object-cover" />
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => (window.location.href = '/')}
                >
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleLogout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="outline" className="mr-2">
                  Login
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 relative z-10">
        <section className="flex flex-col-reverse md:flex-row items-center mb-12 sm:mb-20">
          <div className="flex-1 min-w-0 mt-12 md:mt-0 md:pr-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
              Manage your time <br className="hidden sm:block" />
              <span className="text-indigo-600 dark:text-indigo-400">
                organize your week
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-6 sm:mb-8">
              Plan your days, break tasks into smaller steps, and keep undated
              ideas in Someday. A clear place for what you want to do next.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link to="/">
                  <Button
                    size="lg"
                    className="px-6 sm:px-8 shadow-lg bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transition-colors duration-150 text-white"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/auth/signup">
                  <Button
                    size="lg"
                    className="px-6 sm:px-8 shadow-lg bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transition-colors duration-150 text-white"
                  >
                    Create your account
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="w-full md:w-1/2 lg:w-5/12 shrink-0">
            <TiltCard maxWidth="800px" aspectRatio="4/3">
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-xl shadow-xl flex items-center justify-center overflow-hidden">
                <OptimizedImage
                  src="/images/app-preview.png"
                  alt="OrgaTime application preview"
                  className="w-full h-full"
                  objectFit="contain"
                />
              </div>
            </TiltCard>
          </div>
        </section>

        <section id="features" className="py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-16 text-gray-900 dark:text-gray-100">
            Key features
          </h2>

          <FeatureCards features={features} />
        </section>
      </main>
    </div>
  );
};
