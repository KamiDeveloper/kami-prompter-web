import { test, expect, devices } from '@playwright/test'

const hasAuthEnv = Boolean(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD)
const { defaultBrowserType: _defaultBrowserType, ...iPhone13Device } = devices['iPhone 13']

test.describe('Responsive - Mobile publico', () => {
  test.use({ ...iPhone13Device })

  test('sidebar no es visible en mobile', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('aside[class*="xl:flex"]')
    await expect(sidebar).not.toBeVisible()
  })

  test('landing es responsive en mobile', async ({ page }) => {
    await page.goto('/')
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
})

test.describe('Responsive - Mobile autenticado', () => {
  test.use({ ...iPhone13Device, storageState: 'tests/e2e/.auth-state.json' })
  test.skip(!hasAuthEnv, 'Variables E2E_TEST_USER_* no configuradas')

  test('bottom nav es visible en mobile', async ({ page }) => {
    await page.goto('/app/dashboard')
    const bottomNav = page.locator('nav[class*="md:hidden"]')
    await expect(bottomNav).toBeVisible()
  })
})
