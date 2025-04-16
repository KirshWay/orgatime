import React, { useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export type Props = {
  onConfirm: (title: string) => void;
  onCancel: () => void;
};

export const TaskCreator: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = () => {
    if (inputValue.trim()) onConfirm(inputValue.trim());
  };

  const handleCancel = () => {
    setInputValue("");
    onCancel();
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Enter task"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Button
        className="bg-green-600"
        variant="outline"
        onClick={handleConfirm}
        disabled={!inputValue.trim()}
      >
        <Check />
      </Button>
      <Button className="bg-red-300" variant="outline" onClick={handleCancel}>
        <X />
      </Button>
    </div>
  );
};
