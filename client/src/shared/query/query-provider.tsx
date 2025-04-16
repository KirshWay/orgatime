import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./query-client";

type Props = {
  children: React.ReactNode;
};

export const QueryProvider = ({ children }: Props) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
