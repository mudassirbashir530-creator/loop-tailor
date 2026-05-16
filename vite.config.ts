import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig, loadEnv} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        { find: /^formdata-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^whatwg-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^unfetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^cross-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^isomorphic-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^node-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^headers-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^web-streams-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^event-target-shim(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^abort-controller(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^abortcontroller-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^fetch-blob(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') }
      ],
    },
    optimizeDeps: {
      include: [
        'formdata-polyfill', 'node-fetch', 'headers-polyfill', 
        'web-streams-polyfill', 'event-target-shim', 'abort-controller',
        'fetch-blob'
      ]
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
