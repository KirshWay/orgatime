import { parseISO, startOfWeek } from "date-fns";
import { create } from "zustand";

type WeekState = {
  weekStart: Date;
  setWeekStart: (date: Date) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  resetToCurrentWeek: () => void;
  navigateToWeek: (date: Date) => void;
  getWeekDateFromUrl: (dateParam: string | null) => Date;
};

export const useWeekStore = create<WeekState>((set) => {
  const currentDate = new Date();
  const initialWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  return {
    weekStart: initialWeekStart,

    setWeekStart: (date: Date) => set({ weekStart: date }),

    nextWeek: () => {
      set((state) => {
        const nextWeekDate = new Date(state.weekStart);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        return { weekStart: nextWeekDate };
      });
    },

    prevWeek: () => {
      set((state) => {
        const prevWeekDate = new Date(state.weekStart);
        prevWeekDate.setDate(prevWeekDate.getDate() - 7);
        return { weekStart: prevWeekDate };
      });
    },

    resetToCurrentWeek: () => {
      const now = new Date();
      const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      set({ weekStart: currentWeekStart });
    },

    navigateToWeek: (date: Date) => {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      set({ weekStart });
    },

    getWeekDateFromUrl: (dateParam: string | null) => {
      if (!dateParam) {
        return startOfWeek(new Date(), { weekStartsOn: 1 });
      }

      try {
        const date = parseISO(dateParam);
        return startOfWeek(date, { weekStartsOn: 1 });
      } catch (error) {
        console.error("Invalid date format in URL", error);
        return startOfWeek(new Date(), { weekStartsOn: 1 });
      }
    },
  };
});
