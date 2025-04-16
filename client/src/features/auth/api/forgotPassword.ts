import { apiClient } from "@/shared/api";

type ForgotPasswordParams = {
  email: string;
};

type ForgotPasswordResponse = {
  message: string;
  resetUrl?: string;
};

export const forgotPassword = async ({
  email,
}: ForgotPasswordParams): Promise<ForgotPasswordResponse> => {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    { email },
  );
  return data;
};
