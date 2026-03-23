import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth-state.json' })
const hasAuthEnv = Boolean(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD)
test.skip(!hasAuthEnv, 'Variables E2E_TEST_USER_* no configuradas')

test.describe('Configuracion', () => {
  test('settings muestra las 3 sub-secciones', async ({ page }) => {
    await page.goto('/app/settings')
    await expect(page.getByText('API Keys')).toBeVisible()
    await expect(page.getByText('Apariencia')).toBeVisible()
    await expect(page.getByText(/preferencias.*ia|ia.*preferencias/i)).toBeVisible()
  })

  test('navega a /settings/api-keys', async ({ page }) => {
    await page.goto('/app/settings')
    await page.getByText('API Keys').click()
    await expect(page).toHaveURL(/\/settings\/api-keys/)
  })

  test('api keys muestra cards para Flash y Pro', async ({ page }) => {
    await page.goto('/app/settings/api-keys')
    await expect(page.getByText(/gemini flash/i)).toBeVisible()
    await expect(page.getByText(/gemini pro/i)).toBeVisible()
  })

  test('guardar API Key hace POST a /api/keys/store', async ({ page }) => {
    let capturedBody: unknown
    await page.route('/api/keys/store', async (route) => {
      capturedBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.goto('/app/settings/api-keys')

    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('AIzaTestKeyForFlash1234567890')

    await page.getByRole('button', { name: /guardar/i }).first().click()

    await expect(page.getByText(/guardad|exito|success|configur/i)).toBeVisible({ timeout: 5000 })

    const payload = capturedBody as { keyType: string }
    expect(payload.keyType).toBe('flash_free')
    expect(JSON.stringify(payload)).not.toContain('AIzaTestKeyForFlash')
  })

  test('cambiar tema aplica clase al documento', async ({ page }) => {
    await page.route('/api/user/settings', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { theme: 'light' } }),
      }),
    )

    await page.goto('/app/settings/appearance')
    await page.getByRole('button', { name: /claro|light/i }).click()
    await page.getByRole('button', { name: /guardar/i }).click()

    const htmlClass = (await page.locator('html').getAttribute('class')) || ''
    expect(htmlClass).toContain('light')
  })
})
