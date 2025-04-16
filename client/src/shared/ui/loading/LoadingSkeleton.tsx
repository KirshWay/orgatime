interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton = ({ className = "" }: LoadingSkeletonProps) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
};
