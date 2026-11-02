import { useRef } from 'react';

import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  isPending = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onCancel();
      }}
    >
      <DialogContent
        className="max-w-sm bg-white p-5 dark:bg-gray-900"
        overlayClassName="bg-black/40"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus.current?.focus();
        }}
        onEscapeKeyDown={(event) => {
          event.stopPropagation();
          if (isPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!isPending) onCancel();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            ref={cancelRef}
            variant="outline"
            disabled={isPending}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
