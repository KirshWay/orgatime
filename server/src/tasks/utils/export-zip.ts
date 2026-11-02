import archiver from 'archiver';
import { existsSync } from 'fs';
import { resolveTaskImagePath } from 'src/utils/task-image-path';

import { Task, Subtask, TaskImage } from '@prisma/client';

import { generateTasksMarkdown } from './export-markdown';

type TaskWithRelations = Task & {
  subtasks: Subtask[];
  images: TaskImage[];
};

export function createExportZip(
  tasks: TaskWithRelations[],
  uploadsDir: string,
): archiver.Archiver {
  const archive = archiver('zip', { zlib: { level: 6 } });

  archive.on('error', (err) => {
    throw err;
  });

  const markdown = generateTasksMarkdown(tasks, true);
  archive.append(markdown, { name: 'tasks.md' });

  for (const task of tasks) {
    for (const image of task.images) {
      let filePath: string;
      try {
        filePath = resolveTaskImagePath(image, uploadsDir);
      } catch {
        continue;
      }
      const safeFilename = image.filename;
      if (existsSync(filePath)) {
        archive.file(filePath, { name: `images/${safeFilename}` });
      }
    }
  }

  archive.finalize();

  return archive;
}
