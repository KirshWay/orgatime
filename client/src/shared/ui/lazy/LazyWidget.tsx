import { Suspense } from "react";

import { LoadingFallback } from "@/shared/ui/loading";

type Props = {
  children: React.ReactNode;
};

export const LazyWidget = ({ children }: Props) => {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
};
