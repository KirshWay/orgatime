import { useMutation } from "@tanstack/react-query";

import { forgotPassword } from "../api/forgotPassword";

type ForgotPasswordParams = {
  email: string;
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (params: ForgotPasswordParams) => forgotPassword(params),
  });
};
