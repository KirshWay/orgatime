type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

type Props = {
  features: Feature[];
};

export const FeatureCards = ({ features }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
      {features.map((feature) => (
        <div
          key={`feature-${feature.title}`}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="h-14 w-14 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-6">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-indigo-600 dark:text-indigo-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {feature.icon}
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            {feature.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
};
