import React from "react";

import { Button } from "@/shared/ui/button";
import { OptimizedImage } from "@/shared/ui/optimized-image";
import { SEO } from "@/shared/ui/seo";

type Props = {
  children: React.ReactNode;
};

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo?: {
    message: string;
    stack?: string;
  };
}

export class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: { message: error.message } };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <SEO
            title="Error Occurred"
            description="Something went wrong while loading the page. Please try reloading."
            noindex={true}
          />

          <OptimizedImage
            src="/images/error.png"
            alt="Something went wrong"
            className="max-w-full w-full sm:max-w-4xl h-auto mb-6"
          />

          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Oops, something went wrong
          </h1>

          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {this.state.errorInfo?.message || "Unknown error"}
          </p>

          <Button
            className="mt-4 px-4 py-2 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
