import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword";
import { ResetPasswordLink } from "@/features/auth/ui/ResetPasswordLink";
import { parseApiError } from "@/shared/lib/parseApiError";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SEO } from "@/shared/ui/seo";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword = () => {
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const navigate = useNavigate();
  const forgotPasswordMutation = useForgotPassword();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await forgotPasswordMutation.mutateAsync({
        email: data.email,
      });

      if (response.resetUrl) {
        setResetUrl(response.resetUrl);
      } else {
        toast.success(response.message);
        navigate("/auth/login");
      }
    } catch (error: unknown) {
      toast.error(parseApiError(error));
    }
  };

  const handleBackToLogin = () => {
    navigate("/auth/login");
  };

  if (resetUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <SEO
          title="Password Reset Link"
          description="Use this link to reset your password for OrgaTime account."
          noindex={true}
          nofollow={true}
        />

        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Password reset
          </h1>
          <ResetPasswordLink resetUrl={resetUrl} onBack={handleBackToLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <SEO
        title="Forgot Password"
        description="Reset your OrgaTime account password by entering your email to receive a password reset link."
        noindex={true}
        nofollow={true}
      />

      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Password reset
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enter your email associated with your account to get a link to reset
          your password
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full space-y-4 flex flex-col"
        >
          <Input
            {...register("email")}
            placeholder="Enter your email"
            type="email"
          />

          {errors.email && (
            <p className="text-red-600 text-sm">{errors.email.message}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || forgotPasswordMutation.isPending}
          >
            {isSubmitting || forgotPasswordMutation.isPending
              ? "Sending..."
              : "Send"}
          </Button>

          <Button type="button" variant="ghost" onClick={handleBackToLogin}>
            Back to login
          </Button>
        </form>
      </div>
    </div>
  );
};
