import path, { resolve } from 'path';

import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';

dotenv.config({ path: resolve(__dirname, '.env') });

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  server: {
    host: '0.0.0.0',
  },
  css: {
    modules: false as false | undefined,
    preprocessorOptions: {},
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts'],
  },
}));
