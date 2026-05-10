export const FormData = typeof window !== 'undefined' ? window.FormData : class {};
export const File = typeof window !== 'undefined' ? window.File : class {};
export const fetch = typeof window !== 'undefined' ? window.fetch : () => {};
export default {};
