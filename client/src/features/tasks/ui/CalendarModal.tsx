import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { AnimatePresence, motion as m } from "motion/react";

import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  currentTaskDate?: Date | null;
  onNavigateToWeek?: (date: Date) => void;
};

export const CalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectDate,
  currentTaskDate,
  onNavigateToWeek,
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const isSameAsCurrentDate =
    currentTaskDate && date ? isSameDay(date, currentTaskDate) : false;

  const handleSelectDate = () => {
    if (date && !isSameAsCurrentDate) {
      onSelectDate(date);

      if (onNavigateToWeek && date) {
        onNavigateToWeek(date);
      }

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
            Choose a date to move the task
          </DialogDescription>
        </DialogHeader>

        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="mx-auto"
            modifiers={{
              booked: currentTaskDate ? [currentTaskDate] : [],
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: "rgba(217, 217, 217, 0.3)",
                borderRadius: "0",
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
                  {`Move to ${format(date, "dd.MM.yyyy")}`}
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
