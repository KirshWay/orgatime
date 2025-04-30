import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfWeek } from "date-fns";
import {
  Calendar,
  CalendarArrowUp,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Copy,
  Pipette,
  Plus,
  Trash,
} from "lucide-react";
import { AnimatePresence, motion as m } from "motion/react";

import { Subtask, TASK_COLOR_HEX, TaskColor, TaskImage } from "@/entities/task";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";
import { Textarea } from "@/shared/ui/textarea";

import {
  useCreateSubtask,
  useDeleteSubtask,
  useDuplicateTask,
  useUpdateSubtask,
  useUpdateTask,
  useUpdateTaskDate,
} from "../hooks";
import { TaskFormData, taskSchema } from "../model/validation";
import { CalendarModal } from "./CalendarModal";
import { SubtaskCreator } from "./SubtaskCreator";
import { SubtaskItem } from "./SubtaskItem";
import { TaskImages } from "./TaskImages";

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
  onSave: (updatedData: {
    title: string;
    description: string;
    completed: boolean;
    color: TaskColor | null;
  }) => void;
  onDelete: () => void;
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
  initialSubtasks = [],
  initialImages = [],
  isSomeday = false,
  isFromSearch = false,
  currentWeekStart,
  onSave,
  onDelete,
  onNavigateToWeek,
}) => {
  const [completed, setCompleted] = useState(initialCompleted);
  const [selectedColor, setSelectedColor] = useState<TaskColor | null>(
    initialColor,
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [images, setImages] = useState<TaskImage[]>(initialImages);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const updateDateMutation = useUpdateTaskDate();
  const duplicateTaskMutation = useDuplicateTask();
  const updateTaskMutation = useUpdateTask();
  const createSubtaskMutation = useCreateSubtask();
  const updateSubtaskMutation = useUpdateSubtask();
  const deleteSubtaskMutation = useDeleteSubtask();

  const methods = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialTitle,
      description: initialDescription || "",
    },
  });

  const { watch, formState } = methods;

  const titleValue = watch("title");

  const isTitleValid = titleValue.trim().length > 0;
  const isColorChanged = selectedColor !== initialColor;
  const isUpdateEnabled = (formState.isDirty && isTitleValid) || isColorChanged;

  const isTaskOnCurrentWeek = useMemo(() => {
    if (!initialDueDate || !currentWeekStart) return false;

    const taskDate = new Date(initialDueDate);
    const taskWeekStart = startOfWeek(taskDate, { weekStartsOn: 1 });
    return taskWeekStart.getTime() === currentWeekStart.getTime();
  }, [initialDueDate, currentWeekStart]);

  useEffect(() => {
    if (isOpen) {
      methods.reset({
        title: initialTitle,
        description: initialDescription || "",
      });
      setCompleted(initialCompleted);
      setSelectedColor(initialColor);
      setSubtasks(initialSubtasks);
      setImages(initialImages);
    }
  }, [
    isOpen,
    initialTitle,
    initialDescription,
    initialCompleted,
    initialColor,
    initialSubtasks,
    initialImages,
    methods,
  ]);

  const handleUpdate = (data: TaskFormData) => {
    onSave({
      title: data.title,
      description: data.description || "",
      completed,
      color: selectedColor,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleCompletedChange = (val: boolean) => {
    setCompleted(val);

    if (val !== initialCompleted) {
      updateTaskMutation.mutate({
        id: taskId,
        data: { completed: val },
      });
    }
  };

  const handleSetTomorrow = () => {
    updateDateMutation.mutate(
      {
        taskId,
        data: { action: "tomorrow" },
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  const handleSetNextWeek = () => {
    updateDateMutation.mutate(
      {
        taskId,
        data: { action: "nextWeek" },
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  const handleSetSomeday = () => {
    updateDateMutation.mutate(
      {
        taskId,
        data: { action: "someday" },
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  const handleSetCustomDate = (date: Date) => {
    updateDateMutation.mutate(
      {
        taskId,
        data: {
          action: "custom",
          customDate: date.toISOString(),
        },
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  const handleDuplicate = () => {
    duplicateTaskMutation.mutate(taskId, {
      onSuccess: () => onClose(),
    });
  };

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

  const handleGoToTaskWeek = () => {
    if (initialDueDate && onNavigateToWeek) {
      const date = new Date(initialDueDate);
      onNavigateToWeek(date);
      onClose();
    }
  };

  const buttonsChangeDate = (isSomeday: boolean) => {
    if (isSomeday) {
      return (
        <Button onClick={handleDuplicate}>
          Duplicate <Copy />
        </Button>
      );
    }

    return (
      <>
        <Button className="w-full" onClick={handleSetTomorrow}>
          Tomorrow <ChevronRight />
        </Button>
        <Button className="w-full" onClick={handleSetNextWeek}>
          Next week <CalendarArrowUp />
        </Button>
        <Button className="w-full" onClick={handleSetSomeday}>
          Someday <CalendarRange />
        </Button>
        <Button className="w-full" onClick={handleDuplicate}>
          Duplicate <Copy />
        </Button>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-xl max-h-[75svh] overflow-y-auto sm:max-h-[90svh] p-4 sm:p-6"
        style={
          selectedColor
            ? { backgroundColor: TASK_COLOR_HEX[selectedColor] }
            : {}
        }
      >
        <DialogHeader>
          <DialogTitle className="flex flex-row items-center justify-between py-2">
            <span className="flex items-center gap-2 text-lg">
              {initialDueDate && (
                <>
                  <Calendar className="hidden sm:inline" />{" "}
                  {format(initialDueDate, "EEE, dd MMM yyyy")}
                </>
              )}
            </span>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleDelete}
                variant="outline"
                className="rounded-full h-8 w-8 p-0 sm:h-10 sm:w-10"
                title="Delete task"
              >
                <Trash className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="rounded-full h-8 w-8 p-0 sm:h-10 sm:w-10"
                    variant="outline"
                    style={
                      selectedColor
                        ? { backgroundColor: TASK_COLOR_HEX[selectedColor] }
                        : {}
                    }
                    title="Change color"
                  >
                    <Pipette className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-3">
                  <DropdownMenuGroup className="flex justify-center gap-2">
                    <DropdownMenuItem
                      onClick={() => setSelectedColor("STANDART")}
                    >
                      <div
                        className="w-6 h-6 rounded-full cursor-pointer"
                        style={{ backgroundColor: TASK_COLOR_HEX.STANDART }}
                      />
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setSelectedColor("BLUE")}>
                      <div
                        className="w-6 h-6 rounded-full cursor-pointer"
                        style={{ backgroundColor: TASK_COLOR_HEX.BLUE }}
                      />
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setSelectedColor("RED")}>
                      <div
                        className="w-6 h-6 rounded-full cursor-pointer"
                        style={{ backgroundColor: TASK_COLOR_HEX.RED }}
                      />
                    </DropdownMenuItem>

                    {selectedColor && (
                      <>
                        <Separator orientation="vertical" className="h-6" />
                        <DropdownMenuItem
                          onClick={() => setSelectedColor(null)}
                        >
                          <div className="w-6 h-6 rounded-full cursor-pointer border border-gray-300 flex items-center justify-center">
                            <Trash className="h-3 w-3 text-gray-500" />
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogTitle>
        </DialogHeader>

        <FormProvider {...methods}>
          <div className="grid gap-4 py-2 sm:py-4 pb-4">
            <div className="flex justify-between items-center gap-3">
              <Input {...methods.register("title")} placeholder="Task title" />
              <Checkbox
                className="w-6 h-6 sm:w-8 sm:h-8"
                checked={completed}
                onCheckedChange={(val) => {
                  if (typeof val === "boolean") {
                    handleCompletedChange(val);
                  }
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between">
              {buttonsChangeDate(isSomeday)}
            </div>

            {!isSomeday && (
              <Button onClick={() => setIsCalendarOpen(true)}>
                Move it to a specific day <CalendarDays />
              </Button>
            )}

            {isFromSearch &&
              initialDueDate &&
              !isSomeday &&
              !isTaskOnCurrentWeek &&
              onNavigateToWeek && (
                <Button
                  onClick={handleGoToTaskWeek}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Go to the week of this task <CalendarDays />
                </Button>
              )}

            <Textarea
              {...methods.register("description")}
              placeholder="Task description"
              className="resize-none"
              rows={4}
            />

            <Separator />

            <TaskImages
              taskId={taskId}
              taskImages={images}
              onImagesChange={setImages}
            />

            <Separator />

            <p className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">
              Subtasks
            </p>

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
                className="text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Add subtask
              </Button>
            )}
          </div>
        </FormProvider>

        <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
          <AnimatePresence>
            {isUpdateEnabled && (
              <m.div
                key="updateButton"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="outline"
                  onClick={methods.handleSubmit(handleUpdate)}
                  className="text-sm sm:text-base h-8 sm:h-10 w-full sm:w-auto"
                >
                  Update
                </Button>
              </m.div>
            )}
          </AnimatePresence>

          <Button
            onClick={onClose}
            className="text-sm sm:text-base h-8 sm:h-10 font-medium"
            variant="default"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={handleSetCustomDate}
        currentTaskDate={initialDueDate ? new Date(initialDueDate) : null}
        onNavigateToWeek={onNavigateToWeek}
      />
    </Dialog>
  );
};
