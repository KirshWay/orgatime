import { fireEvent, render, screen } from '@testing-library/react';
import { domAnimation, LazyMotion } from 'motion/react';
import { afterEach, expect, test, vi } from 'vitest';

import { CalendarModal } from './CalendarModal';

afterEach(() => vi.useRealTimers());

test('current task date stays readable when selected and applying another date navigates then closes', () => {
  const today = new Date(2026, 8, 23);
  vi.setSystemTime(today);
  const onSelectDate = vi.fn();
  const onNavigateToWeek = vi.fn();
  const onClose = vi.fn();
  render(
    <LazyMotion features={domAnimation}>
      <CalendarModal
        isOpen
        onClose={onClose}
        currentTaskDate={today}
        onSelectDate={onSelectDate}
        onNavigateToWeek={onNavigateToWeek}
      />
    </LazyMotion>,
  );
  // The booked inline background wins over selection styles; its text must
  // retain the matching foreground rather than white selected-day text.
  expect(screen.getByRole('gridcell', { selected: true })).toHaveStyle({
    color: 'var(--color-foreground)',
  });
  expect(
    screen.queryByRole('button', { name: /^Move to/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /next month/i }));
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const month = nextMonth.toLocaleString('en-US', { month: 'long' });
  fireEvent.click(
    screen.getByRole('button', { name: new RegExp(`${month} 1st,`) }),
  );
  fireEvent.click(screen.getByRole('button', { name: /^Move to/ }));
  expect(onSelectDate).toHaveBeenCalledWith(nextMonth);
  expect(onNavigateToWeek).toHaveBeenCalledWith(nextMonth);
  expect(onClose).toHaveBeenCalledOnce();
});
