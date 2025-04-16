import { motion } from "motion/react";

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
};

type Props = {
  features: Feature[];
};

export const FeatureCards = ({ features }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {features.map((feature, index) => (
        <motion.div
          key={index}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: feature.delay }}
          viewport={{ once: true }}
        >
          <div className="h-14 w-14 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-8 w-8 text-indigo-600 dark:text-indigo-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {feature.icon}
            </svg>
          </div>
          <p className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            {feature.title}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
