import { apiClient } from "@/shared/api";
import { UserProfile } from "@/shared/stores/userStore";

export const updateProfile = async (data: {
  username: string;
  email: string;
}): Promise<UserProfile> => {
  const response = await apiClient.patch<UserProfile>("/users/profile", data);
  return response.data;
};

export const updatePassword = async (data: {
  oldPassword: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    "/users/change-password",
    data,
  );
  return response.data;
};

export const updateAvatar = async (
  file: File,
): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await apiClient.post<{ avatarUrl: string }>(
    "/users/avatar",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
};
