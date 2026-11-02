import React, { useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type Props = {
  onConfirm: (title: string) => void;
  onCancel: () => void;
};

export const TaskCreator: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const isComposing = useRef(false);
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (inputValue.trim()) onConfirm(inputValue.trim());
  };

  const handleCancel = () => {
    setInputValue('');
    onCancel();
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        aria-label="New task title"
        className="min-w-0 flex-1"
        placeholder="Enter task"
        onCompositionStart={() => {
          isComposing.current = true;
        }}
        onCompositionEnd={() => {
          isComposing.current = false;
        }}
        onKeyDown={(event) => {
          if (isComposing.current || event.nativeEvent.isComposing) return;
          if (event.key === 'Enter') {
            event.preventDefault();
            handleConfirm();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            handleCancel();
          }
        }}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Button
        aria-label="Create task"
        className="shrink-0 text-indigo-600"
        size="icon"
        variant="outline"
        onClick={handleConfirm}
        disabled={!inputValue.trim()}
      >
        <Check />
      </Button>
      <Button
        aria-label="Cancel task creation"
        className="shrink-0"
        size="icon"
        variant="ghost"
        onClick={handleCancel}
      >
        <X />
      </Button>
    </div>
  );
};
