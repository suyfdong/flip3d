declare module "occt-import-js" {
  type OcctOptions = {
    locateFile?: (path: string) => string;
  };
  const factory: (options?: OcctOptions) => Promise<unknown>;
  export default factory;
}
