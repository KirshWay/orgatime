import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { SEO } from "@/shared/ui/seo";

export const ForgotPassword = () => {
  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();
  const supportEmail =
    import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com";
  const mailSubject = encodeURIComponent("Password recovery request");
  const mailBody = encodeURIComponent(
    "Hi, I need help recovering access to my account.\n\nAccount email: \nApproximate registration date: \n",
  );

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setIsCopied(true);
      toast.success("Support email copied");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error: unknown) {
      toast.error("Could not copy email");
    }
  };

  const handleBackToLogin = () => {
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <SEO
        title="Account Recovery"
        description="Contact support to recover access to your OrgaTime account."
        noindex={true}
        nofollow={true}
      />

      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Account recovery
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Password recovery is handled by support. Write to{" "}
          <span className="font-medium">{supportEmail}</span> from your account
          email.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Include your account email and approximate registration date to speed up
          verification.
        </p>

        <div className="w-full space-y-4 flex flex-col">
          <Button asChild>
            <a href={`mailto:${supportEmail}?subject=${mailSubject}&body=${mailBody}`}>
              Write to support
            </a>
          </Button>

          <Button type="button" variant="outline" onClick={handleCopyEmail}>
            {isCopied ? "Copied" : "Copy support email"}
          </Button>

          <Button type="button" variant="ghost" onClick={handleBackToLogin}>
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
};
