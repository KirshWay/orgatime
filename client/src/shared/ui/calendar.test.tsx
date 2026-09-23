import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { Calendar } from './calendar';

const selected = new Date(2026, 8, 23);

test('selected, today and outside styles reach the rendered DayPicker v9 cells', () => {
  render(
    <Calendar
      mode="single"
      defaultMonth={selected}
      selected={selected}
      today={new Date(2026, 8, 24)}
    />,
  );
  expect(screen.getByRole('gridcell', { selected: true })).toHaveClass(
    'aria-selected:bg-primary',
  );
  expect(
    screen.getByRole('button', { name: /September 24th/ }).closest('td'),
  ).toHaveClass('bg-accent');
  expect(
    screen.getByRole('button', { name: /August 31st/ }).closest('td'),
  ).toHaveClass('text-muted-foreground');
  expect(screen.getByRole('button', { name: /September 23rd/ })).toHaveClass(
    'h-9',
    'w-9',
  );
});

test('date selection, month navigation and booked modifiers keep their contracts', () => {
  const onSelect = vi.fn();
  render(
    <Calendar
      mode="single"
      defaultMonth={selected}
      onSelect={onSelect}
      modifiers={{ booked: [selected] }}
      modifiersStyles={{ booked: { borderRadius: '0' } }}
    />,
  );
  const day = screen.getByRole('button', { name: /September 23rd/ });
  expect(day.closest('td')).toHaveStyle({ borderRadius: '0' });
  fireEvent.click(day);
  expect(onSelect.mock.calls[0][0]).toEqual(selected);
  fireEvent.click(screen.getByRole('button', { name: /next month/i }));
  expect(screen.getByText('October 2026')).toBeInTheDocument();
});

test('range endpoints and middle receive separate styles on the actual cells', () => {
  render(
    <Calendar
      mode="range"
      defaultMonth={selected}
      selected={{ from: selected, to: new Date(2026, 8, 25) }}
    />,
  );
  const cells = screen.getAllByRole('gridcell', { selected: true });
  expect(cells).toHaveLength(3);
  expect(cells[0]).toHaveClass('rounded-l-md');
  expect(cells[1]).toHaveClass('bg-accent');
  expect(cells[2]).toHaveClass('rounded-r-md');
  expect(within(cells[1]).getByRole('button')).toBeEnabled();
});
