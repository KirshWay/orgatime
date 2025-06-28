import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isSameDay, startOfWeek } from "date-fns";

import { useWeekStore } from "@/shared/stores/weekStore";

export const useWeekNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    weekStart,
    getWeekDateFromUrl,
    setWeekStart,
    nextWeek,
    prevWeek,
    resetToCurrentWeek,
    navigateToWeek,
  } = useWeekStore();

  useEffect(() => {
    const dateParam = searchParams.get("date");
    const initialWeekStart = getWeekDateFromUrl(dateParam);
    setWeekStart(initialWeekStart);
  }, [getWeekDateFromUrl, searchParams, setWeekStart]);

  const handleNextWeek = () => {
    nextWeek();
    updateUrlParams();
  };

  const handlePrevWeek = () => {
    prevWeek();
    updateUrlParams();
  };

  const handleResetWeek = () => {
    resetToCurrentWeek();
    updateUrlParams();
  };

  const handleNavigateToWeek = (date: Date) => {
    navigateToWeek(date);
    updateUrlParams();
  };

  const updateUrlParams = () => {
    const newParams = new URLSearchParams(searchParams);
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const actualWeekStart = useWeekStore.getState().weekStart;

    if (isSameDay(actualWeekStart, currentWeekStart)) {
      newParams.delete("date");
    } else {
      newParams.set("date", format(actualWeekStart, "yyyy-MM-dd"));
    }

    setSearchParams(newParams);
  };

  return {
    weekStart,
    handleNextWeek,
    handlePrevWeek,
    handleResetWeek,
    handleNavigateToWeek,
  };
};
