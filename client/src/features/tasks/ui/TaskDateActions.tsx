import {
  CalendarArrowUp,
  CalendarRange,
  ChevronRight,
  Copy,
} from 'lucide-react';

import { Button } from '@/shared/ui/button';

type Props = {
  onSetTomorrow: () => void;
  onSetNextWeek: () => void;
  onSetSomeday: () => void;
  onDuplicate: () => void;
};

export const TaskDateActions: React.FC<Props> = ({
  onSetTomorrow,
  onSetNextWeek,
  onSetSomeday,
  onDuplicate,
}) => {
  return (
    <>
      <Button variant="outline" className="w-full" onClick={onSetTomorrow}>
        +1 day <ChevronRight />
      </Button>
      <Button variant="outline" className="w-full" onClick={onSetNextWeek}>
        +7 days <CalendarArrowUp />
      </Button>
      <Button variant="outline" className="w-full" onClick={onSetSomeday}>
        Someday <CalendarRange />
      </Button>
      <Button variant="outline" className="w-full" onClick={onDuplicate}>
        Duplicate <Copy />
      </Button>
    </>
  );
};
