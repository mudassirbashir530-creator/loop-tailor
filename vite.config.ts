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
        { find: /^formdata-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/empty.ts') },
        { find: /^whatwg-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^unfetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^cross-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^isomorphic-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^node-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^headers-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^web-streams-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^event-target-shim(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^abort-controller(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^abortcontroller-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^fetch-blob(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') }
      ],
    },
    optimizeDeps: {
      exclude: [
        'whatwg-fetch', 'unfetch', 'cross-fetch', 'isomorphic-fetch', 
        'node-fetch', 'formdata-polyfill', 'headers-polyfill', 
        'web-streams-polyfill', 'event-target-shim', 'abort-controller',
        'abortcontroller-polyfill', 'fetch-blob'
      ]
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
