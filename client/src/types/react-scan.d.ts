declare module "react-scan" {
  interface ReactScan {
    init(): void;
  }

  const reactScan: ReactScan;
  export default reactScan;
}

declare module "react-scan/dist/auto.global.js" {}
