import { TaskColor } from '@/entities/task';

export const getTaskColorClass = (color: TaskColor | null): string => {
  if (!color) return '';

  switch (color) {
    case 'STANDART':
      return 'task-color-standart';
    case 'RED':
      return 'task-color-red';
    case 'BLUE':
      return 'task-color-blue';
    default:
      return '';
  }
};
