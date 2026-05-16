const proxy: any = new Proxy(() => proxy, {
  get: () => proxy,
  apply: () => proxy,
  construct: () => proxy,
});

export default proxy;
export const setupWorker = () => proxy;
export const rest = proxy;
export const graphql = proxy;
export const http = proxy;
