import {
  CalendarArrowUp,
  CalendarRange,
  ChevronRight,
  Copy,
} from 'lucide-react';

import { Button } from '@/shared/ui/button';

type Props = {
  isSomeday: boolean;
  onSetTomorrow: () => void;
  onSetNextWeek: () => void;
  onSetSomeday: () => void;
  onDuplicate: () => void;
};

export const TaskDateActions: React.FC<Props> = ({
  isSomeday,
  onSetTomorrow,
  onSetNextWeek,
  onSetSomeday,
  onDuplicate,
}) => {
  if (isSomeday) {
    return (
      <Button onClick={onDuplicate}>
        Duplicate <Copy />
      </Button>
    );
  }

  return (
    <>
      <Button className="w-full" onClick={onSetTomorrow}>
        Tomorrow <ChevronRight />
      </Button>
      <Button className="w-full" onClick={onSetNextWeek}>
        Next week <CalendarArrowUp />
      </Button>
      <Button className="w-full" onClick={onSetSomeday}>
        Someday <CalendarRange />
      </Button>
      <Button className="w-full" onClick={onDuplicate}>
        Duplicate <Copy />
      </Button>
    </>
  );
};
