import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'e2e_audit.spec.js',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
})
