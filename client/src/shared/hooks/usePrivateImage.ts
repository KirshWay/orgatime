import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/lib/apiClient';
import { useUserStore } from '@/shared/stores/userStore';

export function usePrivateImage(
  key: readonly unknown[],
  endpoint: string,
  enabled = true,
) {
  const user = useUserStore((state) => state.user);
  const sessionVersion = useUserStore((state) => state.sessionVersion);
  const query = useQuery({
    queryKey: [...key, sessionVersion],
    enabled: enabled && user !== null,
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
    meta: { persist: false },
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<Blob>(endpoint, {
        responseType: 'blob',
        signal,
      });
      const current = useUserStore.getState();
      if (
        signal.aborted ||
        current.sessionVersion !== sessionVersion ||
        !current.user
      ) {
        throw new DOMException('Attachment request is obsolete', 'AbortError');
      }
      return response.data;
    },
  });
  const [objectUrl, setObjectUrl] = useState<{
    blob: Blob;
    url: string;
    sessionVersion: number;
  } | null>(null);

  useEffect(() => {
    if (!query.data || !user) return;
    const url = URL.createObjectURL(query.data);
    setObjectUrl({ blob: query.data, url, sessionVersion });
    return () => URL.revokeObjectURL(url);
  }, [query.data, user, sessionVersion]);

  const url =
    user &&
    objectUrl?.blob === query.data &&
    objectUrl?.sessionVersion === sessionVersion
      ? objectUrl.url
      : null;
  return { url, isError: query.isError, retry: query.refetch };
}
