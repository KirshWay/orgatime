import React, { memo } from 'react';

import { Task } from '@/entities/task';
import { TaskContainerBase } from '@/widgets/shared';
import { DayInfo } from '@/widgets/types';

import { DayHeader } from './DayHeader';

type Props = {
  day: DayInfo;
  tasks: Task[];
  isCreating: boolean;
  containerId: string;
  onStartCreating: () => void;
  onStopCreating: () => void;
  onConfirmCreating: (title: string) => void;
  onNavigateToWeek?: (date: Date) => void;
};

export const DayColumn: React.FC<Props> = memo(
  ({
    day,
    tasks,
    isCreating,
    containerId,
    onStartCreating,
    onStopCreating,
    onConfirmCreating,
    onNavigateToWeek,
  }) => {
    return (
      <TaskContainerBase
        tasks={tasks}
        containerId={containerId}
        isCreating={isCreating}
        headerContent={<DayHeader day={day} />}
        containerClassName="flex flex-col p-2"
        onStartCreating={onStartCreating}
        onStopCreating={onStopCreating}
        onConfirmCreating={onConfirmCreating}
        onNavigateToWeek={onNavigateToWeek}
      />
    );
  },
);
