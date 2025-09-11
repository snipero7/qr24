import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'tests-e2e/**', // Playwright E2E, run separately
      'node_modules/**',
      'dist/**',
    ],
  },
});

