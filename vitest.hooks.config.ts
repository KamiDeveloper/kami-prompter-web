import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.hooks.ts'],
    include: ['tests/unit/hooks/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['hooks/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
