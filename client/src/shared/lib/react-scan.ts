export const initReactScan = () => {
  if (import.meta.env.DEV) {
    try {
      import("react-scan/dist/auto.global.js");
    } catch (error) {
      console.warn("Failed to initialize React Scan:", error);
    }
  }
};
