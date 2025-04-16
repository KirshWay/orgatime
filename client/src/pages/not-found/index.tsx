import { Link } from "react-router-dom";

import { SEO } from "@/shared/ui/seo";

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <SEO
        title="Page Not Found"
        description="The page you are looking for does not exist. Please check the URL or navigate back to the home page."
        noindex={true}
      />

      <img
        src="/images/not-found.png"
        alt="Page not found"
        className="max-w-full w-full sm:max-w-4xl h-auto mb-6"
      />

      <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Page not found
      </h1>

      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        Unfortunately, there is no page at the address provided
      </p>

      <Link
        to="/"
        className="px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none bg-primary text-primary-foreground shadow hover:bg-primary/90"
      >
        Back to Home
      </Link>
    </div>
  );
};
