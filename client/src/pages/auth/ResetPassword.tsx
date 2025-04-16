import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useResetPassword } from "@/features/auth/hooks/useResetPassword";
import { parseApiError } from "@/shared/lib/parseApiError";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SEO } from "@/shared/ui/seo";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const navigate = useNavigate();
  const location = useLocation();
  const resetPasswordMutation = useResetPassword();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token") || "";

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword: data.newPassword,
      });
      toast.success("Password successfully reset");
      navigate("/auth/login");
    } catch (error: unknown) {
      toast.error(parseApiError(error));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <SEO
        title="Reset Password"
        description="Create a new password for your OrgaTime account."
        noindex={true}
        nofollow={true}
      />

      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Setting a new password
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-4 flex flex-col"
      >
        <Input
          {...register("newPassword")}
          placeholder="Enter a new password"
          type="password"
        />

        {errors.newPassword && (
          <p className="text-red-600 text-sm">{errors.newPassword.message}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || resetPasswordMutation.isPending}
        >
          {isSubmitting || resetPasswordMutation.isPending
            ? "Reset..."
            : "Reset password"}
        </Button>
      </form>
    </div>
  );
};
