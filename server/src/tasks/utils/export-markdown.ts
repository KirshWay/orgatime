import { basename } from 'path';

import { Task, Subtask, TaskImage, TaskColor } from '@prisma/client';

type TaskWithRelations = Task & {
  subtasks: Subtask[];
  images: TaskImage[];
};

const COLOR_EMOJI: Record<TaskColor, string> = {
  STANDART: '⚪',
  RED: '🔴',
  BLUE: '🔵',
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${days[date.getDay()]}`;
}

function dateKey(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function generateTasksMarkdown(
  tasks: TaskWithRelations[],
  includeImagePaths: boolean,
): string {
  const now = new Date();
  const exportDate = formatDate(now.toISOString());

  const lines: string[] = [];
  lines.push('# Orgatime Export');
  lines.push(`> Exported on ${exportDate}`);
  lines.push('');

  const dated: TaskWithRelations[] = [];
  const someday: TaskWithRelations[] = [];

  for (const task of tasks) {
    if (task.dueDate) {
      dated.push(task);
    } else {
      someday.push(task);
    }
  }

  const groups = new Map<string, TaskWithRelations[]>();
  for (const task of dated) {
    const key = dateKey(task.dueDate!);
    const group = groups.get(key);
    if (group) {
      group.push(task);
    } else {
      groups.set(key, [task]);
    }
  }

  const sortedKeys = Array.from(groups.keys()).sort();

  for (const key of sortedKeys) {
    const groupTasks = groups.get(key)!;
    const label = formatDate(groupTasks[0].dueDate!);

    lines.push('---');
    lines.push('');
    lines.push(`## ${label}`);
    lines.push('');

    for (const task of groupTasks.sort((a, b) => a.order - b.order)) {
      renderTask(lines, task, includeImagePaths);
    }
  }

  if (someday.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Someday');
    lines.push('');

    for (const task of someday.sort((a, b) => a.order - b.order)) {
      renderTask(lines, task, includeImagePaths);
    }
  }

  return lines.join('\n');
}

function renderTask(
  lines: string[],
  task: TaskWithRelations,
  includeImagePaths: boolean,
): void {
  const icon = task.completed ? '✅' : '☐';
  lines.push(`### ${icon} ${task.title}`);

  if (task.color && task.color !== 'STANDART') {
    lines.push(`> Color: ${COLOR_EMOJI[task.color]}`);
    lines.push('');
  }

  if (task.description) {
    lines.push('');
    lines.push(task.description);
  }

  if (includeImagePaths && task.images.length > 0) {
    lines.push('');
    for (const image of task.images) {
      lines.push(`![image](images/${basename(image.filename)})`);
    }
  }

  if (task.subtasks.length > 0) {
    lines.push('');
    for (const subtask of task.subtasks) {
      const check = subtask.completed ? 'x' : ' ';
      lines.push(`- [${check}] ${subtask.title}`);
    }
  }

  lines.push('');
}
