import React, { useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Props = {
  onConfirm: (title: string) => void;
  onCancel: () => void;
};

export const SubtaskCreator: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const [title, setTitle] = useState("");

  const handleConfirm = () => {
    if (title.trim()) {
      onConfirm(title.trim());
      setTitle("");
    }
  };

  const handleCancel = () => {
    setTitle("");
    onCancel();
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Task text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button
        className="bg-green-600"
        onClick={handleConfirm}
        disabled={!title.trim()}
      >
        <Check />
      </Button>
      <Button className="bg-red-300" onClick={handleCancel}>
        <X />
      </Button>
    </div>
  );
};
