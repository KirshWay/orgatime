import { useMutation } from "@tanstack/react-query";

import { resetPassword } from "../api/resetPassword";

type ResetPasswordParams = {
  token: string;
  newPassword: string;
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (params: ResetPasswordParams) => resetPassword(params),
  });
};
