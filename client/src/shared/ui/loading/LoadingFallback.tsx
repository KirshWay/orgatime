import { Loader2 } from "lucide-react";

export const LoadingFallback = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-50/50 dark:bg-gray-900/50">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
};
