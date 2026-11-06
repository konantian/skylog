// Metro resolves bundled PNG imports to local numeric asset IDs.
declare module "*.png" {
  const asset: number;
  export default asset;
}
