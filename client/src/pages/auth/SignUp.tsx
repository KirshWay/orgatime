import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuth } from "@/app/providers";
import { parseApiError } from "@/shared/lib/parseApiError";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { OptimizedImage } from "@/shared/ui/optimized-image";
import { SEO } from "@/shared/ui/seo";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers and underscores",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Password must contain at least one number")
    .regex(
      /(?=.*[@$!%*?&])/,
      "Password must contain at least one special character (@$!%*?&)",
    ),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignUp = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    try {
      await registerUser(data);
      toast.success("Registration successful");
      navigate("/");
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <SEO
        title="Sign Up"
        description="Create your OrgaTime account and start organizing your tasks efficiently. Sign up for free."
        keywords="sign up, register, create account, task management"
        canonicalUrl={`${import.meta.env.VITE_SITE_DOMAIN}/auth/signup`}
      />

      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <OptimizedImage
          src="/icon.png"
          alt="Orgatime logo"
          className="max-w-24 sm:max-w-44 h-auto mx-auto mb-6"
        />

        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Sign Up
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <Input
              {...register("email")}
              type="email"
              id="email"
              autoComplete="email"
              className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="Enter your email"
            />
            {errors.email && (
              <span className="text-red-600 text-sm">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Username
            </label>
            <Input
              {...register("username")}
              type="text"
              id="username"
              autoComplete="username"
              className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="Enter your username"
            />
            {errors.username && (
              <span className="text-red-600 text-sm">
                {errors.username.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <Input
              {...register("password")}
              type="password"
              id="password"
              autoComplete="new-password"
              className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="Enter your password"
            />
            {errors.password && (
              <span className="text-red-600 text-sm">
                {errors.password.message}
              </span>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
