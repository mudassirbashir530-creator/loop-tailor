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
        { find: /^firebase\/app$/, replacement: path.resolve(__dirname, 'src/lib/firebase-app-shim.ts') },
        { find: /^firebase\/firestore$/, replacement: path.resolve(__dirname, 'src/lib/firebase-firestore-shim.ts') },
        { find: /^firebase\/auth$/, replacement: path.resolve(__dirname, 'src/lib/firebase-auth-shim.ts') },
        { find: /^firebase\/storage$/, replacement: path.resolve(__dirname, 'src/lib/firebase-storage-shim.ts') },
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
        { find: /^fetch-blob(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-shim.ts') },
        { find: /^msw(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') },
        { find: /^@mswjs\/interceptors(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/void.ts') }
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
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
