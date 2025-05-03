import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";

import { Task } from "@/entities/task";
import { TASK_COLOR_HEX } from "@/entities/task/model/task-colors";
import { searchTasks } from "@/features/tasks/api";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";

export const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(query, 300);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const searchTasksQuery = async () => {
      if (debouncedSearch.trim().length === 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const fetchedResults = await searchTasks(debouncedSearch);
        setResults(fetchedResults);
      } catch (error) {
        console.error("Error searching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    searchTasksQuery();
  }, [debouncedSearch]);

  const handleSelectTask = (task: Task) => {
    setOpen(false);

    navigate(`/?task=${task.id}`);
  };

  const getTaskColorDot = (color: string | null) => {
    if (!color) return null;

    return (
      <div
        className="h-2 w-2 rounded-full mr-2 flex-shrink-0"
        style={{
          backgroundColor: TASK_COLOR_HEX[color as keyof typeof TASK_COLOR_HEX],
        }}
      />
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex lg:w-48 h-9 w-9 rounded-full justify-center lg:justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="lg:mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search tasks...</span>
        <span className="lg:ml-auto hidden lg:inline-flex text-xs">⌘K</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogTitle className="sr-only">Search tasks modal</DialogTitle>

          <DialogDescription className="sr-only">
            Search tasks
          </DialogDescription>

          <div className="flex flex-col">
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-10 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {loading && (
              <div className="py-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              </div>
            )}

            <div className="max-h-80 overflow-y-auto overflow-x-hidden p-2">
              {!loading && results.length === 0 && query && (
                <div className="py-6 text-center text-sm">Tasks not found</div>
              )}

              {!loading && results.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 px-2 py-1.5">
                    Search results
                  </div>
                  <div className="space-y-1">
                    {results.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleSelectTask(task)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm cursor-pointer"
                      >
                        <div className="flex items-center flex-1 truncate">
                          {getTaskColorDot(task.color)}
                          <span
                            className={cn("truncate", {
                              "line-through opacity-60": task.completed,
                            })}
                          >
                            {task.title}
                          </span>
                        </div>

                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(task.dueDate), "dd.MM.yyyy")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className="h-10 w-10 p-0 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <Search className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
};
