import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/ui/button-variants';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-fit p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-4 sm:flex-row',
        month: 'space-y-4',
        month_caption: 'flex h-7 justify-center items-center px-8',
        caption_label: 'text-sm font-medium',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        // DayPicker v9 applies modifiers and aria-selected to the cell,
        // while day_button owns the hit target and keyboard focus.
        day: cn(
          'relative h-9 w-9 p-0 text-center text-sm focus-within:z-20',
          props.mode !== 'range' && 'rounded-md',
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal text-inherit hover:bg-accent/50',
        ),
        range_start: 'rounded-l-md bg-primary text-primary-foreground',
        range_end: 'rounded-r-md bg-primary text-primary-foreground',
        selected:
          props.mode === 'range'
            ? ''
            : 'aria-selected:bg-primary aria-selected:text-primary-foreground',
        today: 'bg-accent text-accent-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'bg-accent text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" {...props} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
