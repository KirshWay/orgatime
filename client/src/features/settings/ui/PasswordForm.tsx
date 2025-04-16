import React from "react";
import { useFormContext } from "react-hook-form";
import { Pencil, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Props = {
  isEditingPassword: boolean;
  setIsEditingPassword: (val: boolean) => void;
};

export const PasswordForm: React.FC<Props> = ({
  isEditingPassword,
  setIsEditingPassword,
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="block text-sm font-bold text-gray-700 dark:text-gray-300">
          Change password?
        </p>

        <Button onClick={() => setIsEditingPassword(!isEditingPassword)}>
          {isEditingPassword ? <X /> : <Pencil />}
        </Button>
      </div>
      {isEditingPassword && (
        <>
          <label
            htmlFor="oldPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Current Password
          </label>
          <Input
            type="password"
            id="oldPassword"
            placeholder="Enter current password"
            {...register("oldPassword")}
          />
          {errors.oldPassword && (
            <p className="text-xs text-red-600">
              {errors.oldPassword.message?.toString()}
            </p>
          )}

          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            New Password
          </label>
          <Input
            type="password"
            id="newPassword"
            placeholder="Enter new password"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-xs text-red-600">
              {errors.newPassword.message?.toString()}
            </p>
          )}

          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirm New Password
          </label>
          <Input
            type="password"
            id="confirmPassword"
            placeholder="Repeat new password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600">
              {errors.confirmPassword.message?.toString()}
            </p>
          )}
        </>
      )}
    </>
  );
};
