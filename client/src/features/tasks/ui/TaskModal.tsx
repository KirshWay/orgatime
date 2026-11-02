import { useId, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format, startOfWeek } from 'date-fns';
import { Calendar, CalendarDays, Plus, Trash } from 'lucide-react';

import { Subtask, TaskColor, TaskImage } from '@/entities/task';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { ConfirmationDialog } from '@/shared/ui/confirmation-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Separator } from '@/shared/ui/separator';
import { Textarea } from '@/shared/ui/textarea';

import {
  useCreateSubtask,
  useDeleteSubtask,
  useDeleteTask,
  useDuplicateTask,
  useUpdateSubtask,
  useUpdateTask,
} from '../hooks';
import { TaskFormData, taskSchema } from '../model/validation';
import { CalendarModal } from './CalendarModal';
import { ColorPicker } from './ColorPicker';
import { SubtaskCreator } from './SubtaskCreator';
import { SubtaskItem } from './SubtaskItem';
import { getTaskColorClass } from './task-color-utils';
import { TaskDateActions } from './TaskDateActions';
import { TaskImages } from './TaskImages';

const EMPTY_SUBTASKS: Subtask[] = [];
const EMPTY_IMAGES: TaskImage[] = [];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialCompleted: boolean;
  initialDueDate: Date | string | null;
  initialColor: TaskColor | null;
  initialSubtasks?: Subtask[];
  initialImages?: TaskImage[];
  isSomeday?: boolean;
  isFromSearch?: boolean;
  currentWeekStart?: Date;
  onNavigateToWeek?: (date: Date) => void;
};

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  taskId,
  initialTitle,
  initialDescription,
  initialCompleted,
  initialDueDate,
  initialColor,
  initialSubtasks = EMPTY_SUBTASKS,
  initialImages = EMPTY_IMAGES,
  isFromSearch = false,
  currentWeekStart,
  onNavigateToWeek,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [images, setImages] = useState<TaskImage[]>(initialImages);
  const isSubmitting = useRef(false);
  const [confirmation, setConfirmation] = useState<
    | { kind: 'discard'; action: 'close' | 'navigate' | 'duplicate' }
    | { kind: 'delete' }
    | null
  >(null);

  const duplicateTaskMutation = useDuplicateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const createSubtaskMutation = useCreateSubtask();
  const updateSubtaskMutation = useUpdateSubtask();
  const deleteSubtaskMutation = useDeleteSubtask();
  const isPending =
    updateTaskMutation.isPending ||
    deleteTaskMutation.isPending ||
    duplicateTaskMutation.isPending;

  const methods = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialTitle,
      description: initialDescription || '',
      completed: initialCompleted,
      color: initialColor,
      dueDate: initialDueDate ? new Date(initialDueDate).toISOString() : null,
    },
  });

  const { watch, formState, setValue } = methods;

  const titleValue = watch('title');
  const completed = watch('completed');
  const selectedColor = watch('color');
  const dueDate = watch('dueDate');
  const initialDate = initialDueDate
    ? new Date(initialDueDate).toISOString()
    : null;

  const isTitleValid = titleValue.trim().length > 0;
  const isUpdateEnabled = formState.isDirty && isTitleValid;

  const isTaskOnCurrentWeek = useMemo(() => {
    if (!initialDueDate || !currentWeekStart) return false;

    const taskDate = new Date(initialDueDate);
    const taskWeekStart = startOfWeek(taskDate, { weekStartsOn: 1 });
    return taskWeekStart.getTime() === currentWeekStart.getTime();
  }, [initialDueDate, currentWeekStart]);

  const handleUpdate = async (data: TaskFormData) => {
    if (isSubmitting.current || isPending) return;
    isSubmitting.current = true;
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: {
          title: data.title,
          description: data.description || '',
          completed: data.completed || false,
          color: data.color || null,
          dueDate: data.dueDate,
        },
      });
      if (data.dueDate && data.dueDate !== initialDate && onNavigateToWeek) {
        onNavigateToWeek(new Date(data.dueDate));
      } else {
        onClose();
      }
    } catch {
      return;
    } finally {
      isSubmitting.current = false;
    }
  };

  const handleDelete = async () => {
    if (isSubmitting.current || isPending) return;
    isSubmitting.current = true;
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      onClose();
    } catch {
      return;
    } finally {
      isSubmitting.current = false;
    }
  };

  const handleDuplicate = async () => {
    if (isSubmitting.current || isPending) return;
    isSubmitting.current = true;
    try {
      await duplicateTaskMutation.mutateAsync(taskId);
      onClose();
    } catch {
      return;
    } finally {
      isSubmitting.current = false;
    }
  };

  const performAction = (action: 'close' | 'navigate' | 'duplicate') => {
    if (isSubmitting.current || isPending) return;
    if (action === 'duplicate') void handleDuplicate();
    else if (action === 'navigate' && initialDate && onNavigateToWeek)
      onNavigateToWeek(new Date(initialDate));
    else onClose();
  };

  const requestAction = (action: 'close' | 'navigate' | 'duplicate') => {
    if (isSubmitting.current || isPending || confirmation) return;
    if (formState.isDirty) setConfirmation({ kind: 'discard', action });
    else performAction(action);
  };

  const handleClose = () => requestAction('close');
  const setDraftDate = (date: string | null) =>
    setValue('dueDate', date, { shouldDirty: true });
  const shiftDraftDate = (days: number) =>
    setDraftDate(
      addDays(dueDate ? new Date(dueDate) : new Date(), days).toISOString(),
    );

  const handleCreateSubtask = (subtaskTitle: string) => {
    createSubtaskMutation.mutate(
      {
        taskId,
        data: { title: subtaskTitle },
      },
      {
        onSuccess: (newSubtask) => {
          setSubtasks((prev) => [...prev, newSubtask]);
          setIsAddingSubtask(false);
        },
      },
    );
  };

  const handleToggleSubtask = (id: string, comp: boolean) => {
    updateSubtaskMutation.mutate(
      {
        taskId,
        subtaskId: id,
        data: { completed: comp },
      },
      {
        onSuccess: (updatedSubtask) => {
          setSubtasks((prev) =>
            prev.map((st) => (st.id === id ? updatedSubtask : st)),
          );
        },
      },
    );
  };

  const handleUpdateSubtask = (id: string, newTitle: string) => {
    updateSubtaskMutation.mutate(
      {
        taskId,
        subtaskId: id,
        data: { title: newTitle },
      },
      {
        onSuccess: (updatedSubtask) => {
          setSubtasks((prev) =>
            prev.map((st) => (st.id === id ? updatedSubtask : st)),
          );
        },
      },
    );
  };

  const handleDeleteSubtask = (id: string) => {
    deleteSubtaskMutation.mutate(
      { taskId, subtaskId: id },
      {
        onSuccess: () => {
          setSubtasks((prev) => prev.filter((st) => st.id !== id));
        },
      },
    );
  };

  const handleColorChange = (color: TaskColor | null) => {
    setValue('color', color, { shouldDirty: true });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        className={cn(
          'task-details bg-white dark:bg-gray-900 max-w-xl max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0',
          selectedColor && 'border-l-[6px]',
          selectedColor && getTaskColorClass(selectedColor),
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleInputRef.current?.focus();
        }}
      >
        <DialogHeader className="border-b border-gray-200 px-4 py-4 text-left dark:border-gray-700 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <DialogTitle>Task details</DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-xs">
                <Calendar className="size-4" aria-hidden="true" />
                {dueDate
                  ? format(new Date(dueDate), 'EEE, dd MMM yyyy')
                  : 'Someday'}
              </DialogDescription>
            </div>
            <fieldset disabled={isPending} className="flex items-center gap-1">
              <Button
                onClick={() => setConfirmation({ kind: 'delete' })}
                disabled={isPending}
                variant="ghost"
                className="size-9 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash className="size-4" />
              </Button>
              <ColorPicker
                selectedColor={selectedColor ?? null}
                onColorChange={handleColorChange}
              />
            </fieldset>
          </div>
        </DialogHeader>

        <FormProvider {...methods}>
          <fieldset
            disabled={isPending}
            className="grid min-h-0 min-w-0 gap-4 overflow-y-auto px-4 py-4 sm:px-6"
          >
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label
                  htmlFor={titleId}
                  className="text-xs font-medium text-gray-600 dark:text-gray-300"
                >
                  Title
                </label>
                <Input
                  {...methods.register('title')}
                  ref={(element) => {
                    methods.register('title').ref(element);
                    titleInputRef.current = element;
                  }}
                  id={titleId}
                  placeholder="Task title"
                />
              </div>
              <Checkbox
                aria-label="Task completed"
                className="size-6 shrink-0 border-gray-400 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white dark:border-gray-500"
                checked={completed}
                onCheckedChange={(val) => {
                  if (typeof val === 'boolean') {
                    setValue('completed', val, { shouldDirty: true });
                  }
                }}
              />
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2">
              <TaskDateActions
                onSetTomorrow={() => shiftDraftDate(1)}
                onSetNextWeek={() => shiftDraftDate(7)}
                onSetSomeday={() => setDraftDate(null)}
                onDuplicate={() => requestAction('duplicate')}
              />
            </div>

            <Button variant="outline" onClick={() => setIsCalendarOpen(true)}>
              Choose a date <CalendarDays />
            </Button>

            {isFromSearch &&
              initialDate &&
              !isTaskOnCurrentWeek &&
              onNavigateToWeek && (
                <Button
                  onClick={() => requestAction('navigate')}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Go to the week of this task <CalendarDays />
                </Button>
              )}

            <div className="space-y-1.5">
              <label
                htmlFor={descriptionId}
                className="text-xs font-medium text-gray-600 dark:text-gray-300"
              >
                Description
              </label>
              <Textarea
                id={descriptionId}
                {...methods.register('description')}
                placeholder="Task description"
                className="resize-none"
                rows={4}
              />
            </div>

            <Separator />

            <p className="text-xs text-muted-foreground">
              Images and subtasks save immediately. Other changes save with
              Update.
            </p>

            <TaskImages
              taskId={taskId}
              taskImages={images}
              onImagesChange={setImages}
            />

            <h3 className="text-sm font-semibold text-gray-700 dark:text-white">
              Subtasks
            </h3>

            {subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={handleToggleSubtask}
                onUpdate={handleUpdateSubtask}
                onDelete={handleDeleteSubtask}
              />
            ))}

            {isAddingSubtask ? (
              <SubtaskCreator
                onConfirm={handleCreateSubtask}
                onCancel={() => setIsAddingSubtask(false)}
              />
            ) : (
              <Button
                onClick={() => setIsAddingSubtask(true)}
                variant="outline"
                className="text-sm"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Add subtask
              </Button>
            )}
          </fieldset>
        </FormProvider>

        <DialogFooter className="flex flex-row justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50 sm:px-6">
          <Button onClick={handleClose} disabled={isPending} variant="outline">
            Close
          </Button>
          <Button
            onClick={methods.handleSubmit(handleUpdate)}
            disabled={!isUpdateEnabled || isPending}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>

      {isOpen && isCalendarOpen && (
        <CalendarModal
          isOpen
          onClose={() => setIsCalendarOpen(false)}
          onSelectDate={(date) => setDraftDate(date.toISOString())}
          currentTaskDate={dueDate ? new Date(dueDate) : null}
        />
      )}
      {isOpen && confirmation && (
        <ConfirmationDialog
          title={
            confirmation.kind === 'delete'
              ? 'Delete task?'
              : 'Discard unsaved changes?'
          }
          description={
            confirmation.kind === 'delete'
              ? 'This task and its attachments will be permanently deleted.'
              : 'Your task changes have not been saved. Discard them to continue?'
          }
          confirmLabel={
            confirmation.kind === 'delete'
              ? 'Delete permanently'
              : 'Discard changes'
          }
          cancelLabel={
            confirmation.kind === 'delete' ? 'Cancel' : 'Keep editing'
          }
          isPending={isPending}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            if (isSubmitting.current || isPending) return;
            if (confirmation.kind === 'delete') void handleDelete();
            else {
              performAction(confirmation.action);
              if (confirmation.action !== 'duplicate') setConfirmation(null);
            }
          }}
        />
      )}
    </Dialog>
  );
};
