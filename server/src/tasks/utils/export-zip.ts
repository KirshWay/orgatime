import * as archiver from 'archiver';
import { existsSync } from 'fs';
import { basename, join } from 'path';

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
      const safeFilename = basename(image.filename);
      const filePath = join(uploadsDir, safeFilename);
      if (existsSync(filePath)) {
        archive.file(filePath, { name: `images/${safeFilename}` });
      }
    }
  }

  archive.finalize();

  return archive;
}
