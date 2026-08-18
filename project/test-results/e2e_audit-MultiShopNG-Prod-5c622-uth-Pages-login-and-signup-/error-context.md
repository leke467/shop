# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e_audit.spec.js >> MultiShopNG Production Playwright Autonomous Audit >> 4. Audit Auth Pages (/login and /signup)
- Location: e2e_audit.spec.js:57:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="email"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const BASE_URL = 'https://shop.adeleke467.workers.dev'
  4  | 
  5  | test.describe('MultiShopNG Production Playwright Autonomous Audit', () => {
  6  |   test('1. Audit Homepage and Core Navigation', async ({ page }) => {
  7  |     await page.goto(`${BASE_URL}/`)
  8  |     await expect(page).toHaveTitle(/MultiShopNG|Shop|Explore/i)
  9  | 
  10 |     const exploreLink = page.locator('a:has-text("Explore")').first()
  11 |     await expect(exploreLink).toBeVisible()
  12 |   })
  13 | 
  14 |   test('2. Audit Referral Dashboard (/referrals)', async ({ page }) => {
  15 |     await page.goto(`${BASE_URL}/referrals`)
  16 | 
  17 |     const header = page.locator('text=Refer & Earn Program')
  18 |     await expect(header).toBeVisible()
  19 | 
  20 |     const whatsappBtn = page.locator('text=Share on WhatsApp')
  21 |     await expect(whatsappBtn).toBeVisible()
  22 | 
  23 |     const linkInput = page.locator('input[readonly]')
  24 |     await expect(linkInput).toBeVisible()
  25 | 
  26 |     const customInput = page.locator('input[placeholder*="Custom Handle"]')
  27 |     await expect(customInput).toBeVisible()
  28 | 
  29 |     const tableHeader = page.locator('text=Earnings History')
  30 |     await expect(tableHeader).toBeVisible()
  31 |   })
  32 | 
  33 |   test('3. Audit Superadmin Control Center (/admin/dashboard)', async ({ page }) => {
  34 |     await page.goto(`${BASE_URL}/admin/dashboard`)
  35 | 
  36 |     const brand = page.locator('text=MultiShopNG').first()
  37 |     await expect(brand).toBeVisible()
  38 | 
  39 |     const tabs = [
  40 |       'Overview',
  41 |       'Order Management',
  42 |       'Product Management',
  43 |       'User Management',
  44 |       'Payments & Revenue',
  45 |       'Disputes & Returns',
  46 |       'Referral Program',
  47 |     ]
  48 | 
  49 |     for (const tabName of tabs) {
  50 |       const tabBtn = page.locator(`button:has-text("${tabName}")`).first()
  51 |       await expect(tabBtn).toBeVisible()
  52 |       await tabBtn.click()
  53 |       await page.waitForTimeout(200)
  54 |     }
  55 |   })
  56 | 
  57 |   test('4. Audit Auth Pages (/login and /signup)', async ({ page }) => {
  58 |     await page.goto(`${BASE_URL}/login`)
> 59 |     await expect(page.locator('input[type="email"]')).toBeVisible()
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  60 | 
  61 |     await page.goto(`${BASE_URL}/signup`)
  62 |     await expect(page.locator('input[type="email"]')).toBeVisible()
  63 |   })
  64 | })
  65 | 
```