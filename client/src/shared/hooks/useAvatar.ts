import { useUserStore } from '@/shared/stores/userStore';

import { usePrivateImage } from './usePrivateImage';

export function useAvatar() {
  const avatar = useUserStore((state) => state.user?.avatar);
  return usePrivateImage(['avatar', avatar], '/users/avatar/content', !!avatar);
}
