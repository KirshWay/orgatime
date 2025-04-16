import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuth } from "@/app/providers/AuthProvider";
import { parseApiError } from "@/shared/lib/parseApiError";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { OptimizedImage } from "@/shared/ui/optimized-image";
import { SEO } from "@/shared/ui/seo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <SEO
        title="Login"
        description="Log in to your OrgaTime account to access your tasks and organize your week."
        keywords="login, account, task management"
        canonicalUrl={`${import.meta.env.VITE_SITE_DOMAIN}/auth/login`}
      />

      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <OptimizedImage
          src="/icon.png"
          alt="Orgatime logo"
          className="max-w-24 sm:max-w-44 h-auto mx-auto mb-6"
        />

        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Login
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <Input
              {...register("password")}
              type="password"
              id="password"
              autoComplete="current-password"
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
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-center mt-4">
          Don't have an account?{" "}
          <Link to="/auth/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>

        <p className="text-sm text-center mt-4">
          Forgot your password?{" "}
          <Link
            to="/auth/forgot-password"
            className="text-blue-600 hover:underline"
          >
            Restore password
          </Link>
        </p>
      </div>
    </div>
  );
};
