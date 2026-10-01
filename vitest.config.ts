import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      // The tsconfig alias Next resolves to payload.config.ts; tests stub it so
      // importing the lead action never pulls the postgres adapter into vitest.
      '@payload-config': resolve(import.meta.dirname, './tests/payload-config.stub.ts'),
    },
  },
})
