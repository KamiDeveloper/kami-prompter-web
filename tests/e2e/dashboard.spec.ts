import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth-state.json' })
const hasAuthEnv = Boolean(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD)
test.skip(!hasAuthEnv, 'Variables E2E_TEST_USER_* no configuradas')

test.describe('Dashboard', () => {
  test('muestra los 4 modulos como cards navegables', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page.getByText('Improver')).toBeVisible()
    await expect(page.getByText('Builder')).toBeVisible()
    await expect(page.getByText('PRD Maker')).toBeVisible()
    await expect(page.locator('a[href="/app/improver"]')).toBeVisible()
  })

  test('muestra skeleton mientras carga historial', async ({ page }) => {
    await page.route('/api/history*', async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 800))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], count: 0 }),
      })
    })

    await page.goto('/app/dashboard')
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]')
    await expect(skeleton.first()).toBeVisible()
  })

  test('muestra estado vacio cuando no hay historial', async ({ page }) => {
    await page.route('/api/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], count: 0 }),
      }),
    )

    await page.goto('/app/dashboard')
    const emptyText = page.getByText(/no hay|sin historial|actividad reciente/i)
    await expect(emptyText).toBeVisible({ timeout: 5000 })
  })

  test('sidebar tiene navegacion a modulos', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page.locator('nav a[href="/app/improver"]')).toBeVisible()
    await expect(page.locator('nav a[href="/app/builder"]')).toBeVisible()
    await expect(page.locator('nav a[href="/app/prd"]')).toBeVisible()
    await expect(page.locator('nav a[href="/app/templates"]')).toBeVisible()
    await expect(page.locator('nav a[href="/app/history"]')).toBeVisible()
  })

  test('ApiKeyBanner aparece cuando no hay keys configuradas', async ({ page }) => {
    await page.route('/api/keys/verify*', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API_KEY_NOT_CONFIGURED' }),
      }),
    )

    await page.goto('/app/improver')
    await expect(page.getByText(/configura.*api key|api key.*configurada/i)).toBeVisible({ timeout: 5000 })
  })
})
