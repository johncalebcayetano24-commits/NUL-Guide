import { defineConfig } from 'vite';
import { pagesFallbackPlugin } from './scripts/pages-fallback.mjs';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? (process.env.PAGES_BASE_PATH || '/NUL-Guide/') : '/',
  plugins: [pagesFallbackPlugin()],
  esbuild: { jsx: 'automatic' },
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    // Archive staging and QA output are generated files, not application modules.
    watch: { ignored: ['**/submission/**', '**/qa/**', '**/design-reference/**'] },
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
}));
