import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion as m } from "motion/react";

import { parseApiError } from "@/shared/lib/parseApiError";
import { UserProfile, useUserStore } from "@/shared/stores/userStore";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Separator } from "@/shared/ui/separator";

import { updateAvatar, updatePassword, updateProfile } from "./api";
import { AvatarUploader } from "./AvatarUploader";
import { SettingsFormData } from "./model/types";
import { settingsSchema } from "./model/validation";
import { PasswordForm } from "./ui/PasswordForm";
import { ProfileForm } from "./ui/ProfileForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useUserStore();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const methods = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    watch,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = methods;

  const oldPassword = watch("oldPassword");
  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");
  const currentUsername = watch("username");
  const currentEmail = watch("email");

  const isPasswordReady =
    !isEditingPassword ||
    (oldPassword.trim() !== "" &&
      newPassword.trim() !== "" &&
      confirmPassword.trim() !== "");

  const isProfileValid =
    currentUsername.trim().length >= 4 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail);

  const isProfileChanged =
    (isEditingUsername &&
      currentUsername !== user?.username &&
      currentUsername.trim() !== "") ||
    (isEditingEmail &&
      currentEmail !== user?.email &&
      currentEmail.trim() !== "");

  const shouldShowUpdate =
    (isProfileChanged && isProfileValid) ||
    (isEditingPassword && isPasswordReady) ||
    avatarFile !== null;

  useEffect(() => {
    if (!isOpen) {
      reset({
        username: user?.username || "",
        email: user?.email || "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsEditingUsername(false);
      setIsEditingEmail(false);
      setIsEditingPassword(false);
    }
  }, [isOpen, reset, user]);

  const profileMutation = useMutation<
    UserProfile,
    Error,
    { username: string; email: string }
  >({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      updateUser(data);
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });

  const passwordMutation = useMutation<
    { message: string },
    Error,
    { oldPassword: string; newPassword: string }
  >({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });

  const avatarMutation = useMutation<{ avatarUrl: string }, Error, File>({
    mutationFn: updateAvatar,
    onSuccess: (data) => {
      updateUser({ avatar: data.avatarUrl });
      setAvatarFile(null);
      toast.success("Avatar updated successfully");
    },
    onError: (error) => {
      toast.error(parseApiError(error));
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    const promises: (
      | Promise<UserProfile>
      | Promise<{ message: string }>
      | Promise<{ avatarUrl: string }>
    )[] = [];

    if (isDirty || avatarFile) {
      promises.push(
        profileMutation.mutateAsync({
          username: data.username,
          email: data.email,
        }),
      );
    }

    if (data.newPassword && data.oldPassword) {
      promises.push(
        passwordMutation.mutateAsync({
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        }),
      );
    }

    if (avatarFile) {
      promises.push(avatarMutation.mutateAsync(avatarFile));
    }

    try {
      await Promise.all(promises);
      onClose();
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <FormProvider {...methods}>
          <div className="space-y-2 mt-4">
            <AvatarUploader
              img={user?.avatar || ""}
              onFileChange={(file) => setAvatarFile(file)}
            />

            <p className="text-xs text-center text-gray-400 dark:text-gray mt-2">
              Click on the avatar to change it
            </p>

            <ProfileForm
              isEditingUsername={isEditingUsername}
              setIsEditingUsername={setIsEditingUsername}
              isEditingEmail={isEditingEmail}
              setIsEditingEmail={setIsEditingEmail}
            />

            <Separator className="h-[2px]" />

            <PasswordForm
              isEditingPassword={isEditingPassword}
              setIsEditingPassword={setIsEditingPassword}
            />
          </div>
        </FormProvider>

        <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
          <AnimatePresence>
            {shouldShowUpdate && (
              <m.div
                key="updateButton"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  onClick={handleSubmit(onSubmit)}
                >
                  Update
                </Button>
              </m.div>
            )}
          </AnimatePresence>

          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
