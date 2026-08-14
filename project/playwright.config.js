import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'e2e_audit.spec.js',
  use: {
    baseURL: 'https://shop.adeleke467.workers.dev',
    headless: true,
  },
})
