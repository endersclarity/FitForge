import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

export default defineConfig({
  mode: process.env.NODE_ENV || 'production',
  root: resolve(__dirname, 'electron'),
  build: {
    outDir: resolve(__dirname, 'electron/dist'),
    lib: {
      entry: {
        main: resolve(__dirname, 'electron/main.ts'),
        preload: resolve(__dirname, 'electron/preload.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'electron',
        'path',
        'fs',
        'url',
        'crypto',
        'stream',
        'util',
        'events',
        'buffer',
        'child_process',
        'os',
        'net',
        'http',
        'https',
        'zlib'
      ],
      output: {
        format: 'es',
      },
    },
    emptyOutDir: true,
    target: 'esnext',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV === 'development',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'),
      '@shared': resolve(__dirname, 'shared'),
    },
  },
  esbuild: {
    platform: 'node',
  },
});