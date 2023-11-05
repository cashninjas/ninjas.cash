import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    supported: {
      // Browsers can handle top-level-await features.
      'top-level-await': true
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mint: resolve(__dirname, 'mint.html'),
        collection: resolve(__dirname, 'collection.html'),
        viewer: resolve(__dirname, 'viewer.html'),
        404: resolve(__dirname, '404.html'),
      },
    },
  },
});