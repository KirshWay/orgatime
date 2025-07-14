import React from "react";
import { useFormContext } from "react-hook-form";
import { Pencil, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Props = {
  isEditingUsername: boolean;
  setIsEditingUsername: (val: boolean) => void;
  isEditingEmail: boolean;
  setIsEditingEmail: (val: boolean) => void;
};

export const ProfileForm: React.FC<Props> = ({
  isEditingUsername,
  setIsEditingUsername,
  isEditingEmail,
  setIsEditingEmail,
}) => {
  const {
    register,
    getValues,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <div className="space-y-1">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Username
        </label>
        <div className="flex space-x-2 justify-between items-center">
          {isEditingUsername ? (
            <Input
              type="text"
              id="username"
              placeholder="Enter your username"
              autoComplete="username"
              {...register("username")}
            />
          ) : (
            <p className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              {getValues("username")}
            </p>
          )}
          <Button
            type="button"
            onClick={() => setIsEditingUsername(!isEditingUsername)}
          >
            {isEditingUsername ? <X /> : <Pencil />}
          </Button>
        </div>
        {errors.username && (
          <p className="text-xs text-red-600">
            {errors.username.message?.toString()}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <div className="flex space-x-2 justify-between items-center">
          {isEditingEmail ? (
            <Input
              type="email"
              id="email"
              placeholder="Enter your email"
              autoComplete="email"
              {...register("email")}
            />
          ) : (
            <p className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              {getValues("email")}
            </p>
          )}
          <Button
            type="button"
            onClick={() => setIsEditingEmail(!isEditingEmail)}
          >
            {isEditingEmail ? <X /> : <Pencil />}
          </Button>
        </div>
        {errors.email && (
          <p className="text-xs text-red-600">
            {errors.email.message?.toString()}
          </p>
        )}
      </div>
    </>
  );
};
