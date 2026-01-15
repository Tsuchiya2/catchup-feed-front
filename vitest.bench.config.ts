import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use forks pool to ensure clean process exit after benchmarks
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.bench.ts'],
    exclude: ['**/node_modules/**'],
    // Benchmark-specific settings
    benchmark: {
      include: ['**/*.bench.ts'],
    },
    // Ensure timely cleanup
    testTimeout: 60000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
