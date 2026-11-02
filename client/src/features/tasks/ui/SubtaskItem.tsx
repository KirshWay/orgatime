import React, { useState } from 'react';
import { Check, Pencil, Trash, X } from 'lucide-react';

import { Subtask } from '@/entities/task';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';

type Props = {
  subtask: Subtask;
  onToggle: (id: string, completed: boolean) => void;
  onUpdate: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
};

export const SubtaskItem: React.FC<Props> = ({
  subtask,
  onToggle,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);

  const handleToggle = (checked: boolean) => {
    onToggle(subtask.id, checked);
  };

  const handleUpdateConfirm = () => {
    if (title.trim() && title.trim() !== subtask.title) {
      onUpdate(subtask.id, title.trim());
    }

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTitle(subtask.title);
    setIsEditing(false);
  };

  const isUpdateDisabled = !title.trim() || title.trim() === subtask.title;

  return (
    <div className="flex items-center justify-between gap-2">
      {isEditing ? (
        <>
          <Input
            aria-label="Subtask title"
            className="min-w-0"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task text"
          />
          <div className="flex gap-2">
            <Button
              aria-label="Save subtask"
              variant="outline"
              onClick={handleUpdateConfirm}
              disabled={isUpdateDisabled}
            >
              <Check />
            </Button>
            <Button
              aria-label="Cancel subtask edit"
              variant="ghost"
              onClick={handleCancelEdit}
            >
              <X />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="min-w-0 flex-1 break-words text-sm font-medium text-gray-700 dark:text-gray-300">
            {subtask.title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Checkbox
              aria-label={`Mark ${subtask.title} as ${subtask.completed ? 'incomplete' : 'complete'}`}
              className="size-5"
              checked={subtask.completed}
              onCheckedChange={(checked) => {
                if (typeof checked === 'boolean') {
                  handleToggle(checked);
                }
              }}
            />
            <Button
              aria-label={`Edit ${subtask.title}`}
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Pencil />
            </Button>
            <Button
              aria-label={`Delete ${subtask.title}`}
              variant="ghost"
              size="icon"
              className="text-red-600 dark:text-red-400"
              onClick={() => onDelete(subtask.id)}
            >
              <Trash />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
