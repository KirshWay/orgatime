import { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  currentTaskDate?: Date | null;
};

export const CalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectDate,
  currentTaskDate,
}) => {
  const [date, setDate] = useState<Date | undefined>(
    currentTaskDate ?? new Date(),
  );

  const isSameAsCurrentDate =
    currentTaskDate && date ? isSameDay(date, currentTaskDate) : false;

  const handleSelectDate = () => {
    if (date && !isSameAsCurrentDate) {
      onSelectDate(date);

      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-fit p-4">
        <DialogHeader className="mx-auto">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Choose date</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose a date, then save your task with Update.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={currentTaskDate ?? new Date()}
            onSelect={setDate}
            className="mx-auto"
            modifiers={{
              booked: currentTaskDate ? [currentTaskDate] : [],
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: 'rgba(217, 217, 217, 0.3)',
                color: 'var(--color-foreground)',
                borderRadius: '0',
              },
            }}
          />
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <AnimatePresence>
            {date && !isSameAsCurrentDate && (
              <m.div
                key="moveButton"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <Button onClick={handleSelectDate} className="w-full">
                  {`Use ${format(date, 'dd.MM.yyyy')}`}
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
