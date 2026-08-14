import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('MultiShopNG E2E Playwright Autonomous Audit', () => {
  test('1. Audit Homepage and Core Navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await expect(page).toHaveTitle(/MultiShopNG|Shop|Explore/i)

    const exploreLink = page.locator('a:has-text("Explore")').first()
    await expect(exploreLink).toBeVisible()
  })

  test('2. Audit Referral Dashboard (/referrals)', async ({ page }) => {
    await page.goto(`${BASE_URL}/referrals`)

    const header = page.locator('text=Refer & Earn Program')
    await expect(header).toBeVisible()

    const whatsappBtn = page.locator('text=Share on WhatsApp')
    await expect(whatsappBtn).toBeVisible()

    const linkInput = page.locator('input[readonly]')
    await expect(linkInput).toBeVisible()

    const customInput = page.locator('input[placeholder*="Custom Handle"]')
    await expect(customInput).toBeVisible()

    const tableHeader = page.locator('text=Earnings History')
    await expect(tableHeader).toBeVisible()
  })

  test('3. Audit Superadmin Control Center (/admin/dashboard)', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`)

    const brand = page.locator('text=MultiShopNG').first()
    await expect(brand).toBeVisible()

    const tabs = [
      'Overview',
      'Order Management',
      'Product Management',
      'User Management',
      'Payments & Revenue',
      'Disputes & Returns',
      'Referral Program',
    ]

    for (const tabName of tabs) {
      const tabBtn = page.locator(`button:has-text("${tabName}")`).first()
      await expect(tabBtn).toBeVisible()
      await tabBtn.click()
      await page.waitForTimeout(200)
    }
  })

  test('4. Audit Auth Pages (/login and /signup)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.locator('input[type="email"]')).toBeVisible()

    await page.goto(`${BASE_URL}/signup`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
