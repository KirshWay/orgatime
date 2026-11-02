import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

export const useSearchTaskNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedTaskId = searchParams.get('task');
  const [selectionSession, setSelectionSession] = useState({
    id: selectedTaskId,
  });
  if (selectionSession.id !== selectedTaskId) {
    setSelectionSession({ id: selectedTaskId });
  }
  const liveSelection = useRef<{
    searchParams: URLSearchParams;
    session: typeof selectionSession;
  } | null>(null);

  useLayoutEffect(() => {
    liveSelection.current = { searchParams, session: selectionSession };
    return () => {
      liveSelection.current = null;
    };
  }, [searchParams, selectionSession]);

  const finishTaskNavigation = (date?: Date, pathname?: string) => {
    const selection = liveSelection.current;
    if (
      !selection ||
      !selectionSession.id ||
      selection.session !== selectionSession
    ) {
      return;
    }

    const nextParams = new URLSearchParams(selection.searchParams);
    nextParams.delete('task');
    if (date) nextParams.set('date', format(date, 'yyyy-MM-dd'));

    if (pathname) {
      navigate({ pathname, search: `?${nextParams}` });
    } else {
      setSearchParams(nextParams);
    }
  };

  return {
    searchParams,
    selectedTaskId,
    closeTaskModal: () => finishTaskNavigation(),
    navigateFromTask: (date: Date, pathname?: string) =>
      finishTaskNavigation(date, pathname),
  };
};
