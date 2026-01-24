import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SonicForge',
      fileName: 'sonic-forge',
    },
    rollupOptions: {
      external: ['standardized-audio-context'],
      output: {
        globals: {
          'standardized-audio-context': 'StandardizedAudioContext',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
