import React, { useState } from "react";
import { Check, Pencil, Trash, X } from "lucide-react";

import { Subtask } from "@/entities/task";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";

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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task text"
          />
          <div className="flex gap-2">
            <Button
              className="bg-green-600 dark:text-white"
              onClick={handleUpdateConfirm}
              disabled={isUpdateDisabled}
            >
              <Check />
            </Button>
            <Button
              className="bg-red-300 dark:text-white"
              onClick={handleCancelEdit}
            >
              <X />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {subtask.title}
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              className="w-8 h-8"
              checked={subtask.completed}
              onCheckedChange={(checked) => {
                if (typeof checked === "boolean") {
                  handleToggle(checked);
                }
              }}
            />
            <Button
              className="bg-gray-600 dark:text-white"
              onClick={() => setIsEditing(true)}
            >
              <Pencil />
            </Button>
            <Button
              className="bg-red-700 dark:text-white"
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
