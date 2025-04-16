import { useState } from "react";
import { format } from "date-fns";

import { useCreateTask } from "@/features/tasks/hooks";

export const useTaskCreation = () => {
  const [creatingForDay, setCreatingForDay] = useState<boolean[]>(
    Array(7).fill(false),
  );

  const [isCreating, setIsCreating] = useState(false);

  const createTaskMutation = useCreateTask();

  const toggleCreatingForDay = (dayIndex: number, value: boolean) => {
    setCreatingForDay((prev) => {
      const newState = [...prev];
      newState[dayIndex] = value;
      return newState;
    });
  };

  const createTaskForDay = (
    dayIndex: number,
    newTitle: string,
    dateObj: Date,
  ) => {
    createTaskMutation.mutate(
      {
        title: newTitle,
        dueDate: format(dateObj, "yyyy-MM-dd"),
      },
      {
        onSuccess: () => {
          toggleCreatingForDay(dayIndex, false);
        },
      },
    );
  };

  const createSomedayTask = (newTitle: string) => {
    createTaskMutation.mutate(
      { title: newTitle },
      {
        onSuccess: () => setIsCreating(false),
      },
    );
  };

  return {
    creatingForDay,
    isCreating,
    setIsCreating,
    toggleCreatingForDay,
    createTaskForDay,
    createSomedayTask,
  };
};
