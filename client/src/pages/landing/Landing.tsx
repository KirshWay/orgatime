import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { motion } from "motion/react";

import { useAuth } from "@/app/providers/AuthProvider";
import { useUserStore } from "@/shared/stores/userStore";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { OptimizedImage } from "@/shared/ui/optimized-image";
import { SEO } from "@/shared/ui/seo";

import { FeatureCards, TiltCard } from "./components";

export const Landing = () => {
  const { isAuthenticated, logout } = useAuth();
  const { user } = useUserStore();

  const features = [
    {
      title: "Weekly planning",
      description:
        "Clear view of the whole week with the ability to drag tasks between days.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
      delay: 0,
    },
    {
      title: "Task management",
      description:
        "Break down complex tasks into subtasks for easier project management.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
      delay: 0.1,
    },
    {
      title: "Color marking",
      description:
        "Use colors to categorize and prioritize tasks by importance and type.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      ),
      delay: 0.2,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
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

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            OrgaTime
          </h1>
        </div>
        <nav>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-10 h-10 p-0 rounded-full overflow-hidden"
                >
                  {user?.avatar ? (
                    <div className="relative h-8 w-8 overflow-hidden rounded-full">
                      <OptimizedImage
                        src={user.avatar}
                        alt="User avatar"
                        className="h-full w-full"
                        objectFit="cover"
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
                  onClick={() => (window.location.href = "/")}
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <section className="flex flex-col-reverse md:flex-row items-center mb-12 sm:mb-20">
          <motion.div
            className="flex-1 mt-12 md:mt-0 md:pr-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
              Manage your time <br className="hidden sm:block" />
              <span className="text-indigo-600 dark:text-indigo-400">
                organize your week
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-6 sm:mb-8">
              OrgaTime - simple and effective way to plan tasks, track progress
              and increase productivity.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link to="/">
                  <Button
                    size="lg"
                    className="px-6 sm:px-8 shadow-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/auth/signup">
                  <Button
                    size="lg"
                    className="px-6 sm:px-8 shadow-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300"
                  >
                    Start using
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
          <motion.div
            className="w-full md:w-1/2 lg:w-5/12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
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
          </motion.div>
        </section>

        <section id="features" className="py-12 sm:py-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-16 text-gray-900 dark:text-gray-100">
            Key features
          </h3>

          <FeatureCards features={features} />
        </section>
      </main>
    </div>
  );
};
