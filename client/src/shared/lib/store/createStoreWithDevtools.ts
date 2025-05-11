import { type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

type DevtoolsOptions = {
  name?: string;
  enabled?: boolean;
  anonymousActionType?: string;
};

export const createStoreWithDevtools = <T>(
  stateCreator: StateCreator<T, [], []>,
  options?: DevtoolsOptions,
) => {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && !options?.enabled) {
    return stateCreator;
  }

  return devtools(stateCreator, {
    enabled: isDev,
    ...options,
  });
};
