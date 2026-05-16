// Safe fetch shim that returns the native browser globals to prevent polyfills from overwriting them
export const fetch = typeof window !== 'undefined' ? window.fetch.bind(window) : () => {};
export const FormData = typeof window !== 'undefined' ? window.FormData : class {};
export const Headers = typeof window !== 'undefined' ? window.Headers : class {};
export const Request = typeof window !== 'undefined' ? window.Request : class {};
export const Response = typeof window !== 'undefined' ? window.Response : class {};
export const AbortController = typeof window !== 'undefined' ? window.AbortController : class {};
export const File = typeof window !== 'undefined' ? window.File : class {};
export const Blob = typeof window !== 'undefined' ? window.Blob : class {};

export default fetch;
