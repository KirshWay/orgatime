import { addDays, format, isSameDay } from "date-fns";

import { DayInfo } from "../types";

export const getWeekDays = (weekStart: Date): DayInfo[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return {
      fullDate: format(day, "dd.MM"),
      dayOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      dateObj: day,
      isToday: isSameDay(day, new Date()),
    };
  });
};
