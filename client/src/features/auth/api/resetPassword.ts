import { apiClient } from "@/shared/api";

type ResetPasswordParams = {
  token: string;
  newPassword: string;
};

export const resetPassword = async ({
  token,
  newPassword,
}: ResetPasswordParams) => {
  const { data } = await apiClient.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return data;
};
