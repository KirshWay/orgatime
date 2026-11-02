import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Search, X } from 'lucide-react';

import { Task } from '@/entities/task';
import { TASK_COLOR_HEX } from '@/entities/task/model/task-colors';
import { searchTasks } from '@/features/tasks/api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';

export const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const term = query.trim();
  const debouncedTerm = useDebounce(term, 300);
  const settled = term === debouncedTerm;
  const search = useQuery({
    queryKey: ['tasks', 'search', debouncedTerm],
    queryFn: () => searchTasks(debouncedTerm),
    enabled: open && !!debouncedTerm && settled,
    retry: false,
  });
  const results = settled ? (search.data ?? []) : [];
  const searching = !!term && (!settled || search.isFetching);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery('');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectTask = (task: Task) => {
    handleOpenChange(false);
    navigate(
      `${location.pathname === '/tasks' ? '/tasks' : '/'}?task=${task.id}`,
    );
  };

  return (
    <>
      <Button
        aria-label="Search tasks"
        variant="outline"
        size="sm"
        className="hidden md:flex lg:w-48 h-9 w-9 rounded-full justify-center lg:justify-start text-muted-foreground"
        onClick={() => handleOpenChange(true)}
      >
        <Search className="lg:mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search tasks...</span>
        <span className="lg:ml-auto hidden lg:inline-flex text-xs">⌘K</span>
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="bg-white dark:bg-gray-900 top-16 sm:top-[15dvh] translate-y-0 sm:max-w-md p-0 gap-0 overflow-hidden data-[state=open]:animate-none data-[state=closed]:animate-none"
          overlayClassName="data-[state=open]:animate-none data-[state=closed]:animate-none"
        >
          <DialogTitle className="sr-only">Search tasks</DialogTitle>
          <DialogDescription className="sr-only">
            Find a task by its title or description.
          </DialogDescription>
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />
            <label className="sr-only" htmlFor="task-search">
              Search tasks
            </label>
            <input
              id="task-search"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
              placeholder="Search tasks..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close search"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[min(20rem,calc(100dvh-10rem))] overflow-y-auto overflow-x-hidden p-2">
            <div
              role="status"
              aria-live="polite"
              className="px-2 py-2 text-sm text-muted-foreground"
            >
              {!term ? (
                'Type to search your tasks.'
              ) : searching ? (
                <span className="flex items-center gap-2">
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  />
                  Searching...
                </span>
              ) : search.isError ? (
                'Search failed. Please try again.'
              ) : results.length === 0 ? (
                'No tasks found.'
              ) : (
                `${results.length} ${results.length === 1 ? 'task' : 'tasks'} found`
              )}
            </div>
            {term && settled && !searching && search.isError && (
              <Button
                variant="outline"
                size="sm"
                className="m-2"
                onClick={() => void search.refetch()}
              >
                Retry
              </Button>
            )}
            {term && !searching && !search.isError && results.length > 0 && (
              <div className="space-y-1">
                {results.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSelectTask(task)}
                    className="flex w-full items-center gap-2 rounded-sm p-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {task.color && (
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            TASK_COLOR_HEX[
                              task.color as keyof typeof TASK_COLOR_HEX
                            ],
                        }}
                      />
                    )}
                    <span
                      className={cn('min-w-0 flex-1 truncate', {
                        'line-through opacity-60': task.completed,
                      })}
                    >
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {format(new Date(task.dueDate), 'dd.MM.yyyy')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button
          aria-label="Search tasks"
          size="icon"
          className="h-10 w-10 p-0 rounded-full shadow-lg"
          onClick={() => handleOpenChange(true)}
        >
          <Search className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
};
