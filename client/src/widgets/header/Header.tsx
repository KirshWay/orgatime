import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek } from "date-fns";
import { Info, Printer, Settings, User } from "lucide-react";

const SettingsModal = lazy(() =>
  import("@/features/settings/SettingsModal").then((module) => ({
    default: module.SettingsModal,
  })),
);

import { useAuth } from "@/app/providers";
import { SearchBar } from "@/features/search";
import { useWeekNavigation } from "@/shared/hooks";
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
import { ModeToggle } from "@/shared/ui/mode-toggle";
import { OptimizedImage } from "@/shared/ui/optimized-image";

export const Header: React.FC = () => {
  const { weekStart, handleNextWeek, handlePrevWeek, handleResetWeek } =
    useWeekNavigation();
  const { user } = useUserStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const isCurrentWeek = currentWeekStart.getTime() === weekStart.getTime();
  const monthYear = `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 no-print">
      <div>
        {isCurrentWeek ? (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {monthYear}
          </h1>
        ) : (
          <button
            onClick={handleResetWeek}
            className="text-lg font-semibold text-[#9BA7F8] hover:text-blue-800 focus:outline-hidden"
          >
            {monthYear}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchBar />
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
                    isAvatar
                  />
                </div>
              ) : (
                <User className="w-full h-full object-cover" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 no-print">
            <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer flex justify-between"
              onClick={handlePrint}
            >
              Print
              <Printer />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer flex justify-between"
              onClick={() => setIsSettingsOpen(true)}
            >
              Settings
              <Settings />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer flex justify-between"
              onClick={() => navigate("/about")}
            >
              About
              <Info />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />

        <div className="flex gap-2">
          <Button
            onClick={handlePrevWeek}
            className="rounded-full"
            variant="outline"
            size="icon"
          >
            ←
          </Button>
          <Button
            onClick={handleNextWeek}
            className="rounded-full"
            variant="outline"
            size="icon"
          >
            →
          </Button>
        </div>
      </div>

      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </Suspense>
    </header>
  );
};
