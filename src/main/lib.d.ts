declare module "request" {
  export default function(
    url: string,
    ops: { timeout: number },
    handler: (err: {}) => void
  ): void;
}
