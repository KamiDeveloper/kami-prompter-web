import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth-state.json' })
const hasAuthEnv = Boolean(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD)
test.skip(!hasAuthEnv, 'Variables E2E_TEST_USER_* no configuradas')

test.describe('Modulo Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/builder')
  })

  test('muestra los 5 bloques CREDO', async ({ page }) => {
    await expect(page.getByText(/contexto|context/i)).toBeVisible()
    await expect(page.getByText(/rol|role/i)).toBeVisible()
    await expect(page.getByText(/especif|expect/i)).toBeVisible()
    await expect(page.getByText(/datos|data/i)).toBeVisible()
    await expect(page.getByText(/output/i)).toBeVisible()
  })

  test('preview se actualiza al escribir en CREDO', async ({ page }) => {
    const textareas = page.locator('textarea')
    await textareas.first().fill('Actua como experto en Python')
    await expect(page.getByText('Actua como experto en Python')).toHaveCount(2)
  })

  test('Pulir con IA envia bloques CREDO al backend', async ({ page }) => {
    let capturedBody: unknown
    await page.route('/api/ai/build', async (route) => {
      capturedBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            assembledPrompt: 'prompt ensamblado',
            refinedPrompt: 'prompt refinado y mejorado',
          },
        }),
      })
    })

    const textareas = page.locator('textarea')
    await textareas.first().fill('Contexto de prueba')
    await textareas.nth(1).fill('Rol de prueba')

    await page.getByRole('button', { name: /pulir|refinar|build/i }).click()

    await expect(page.getByText('prompt refinado')).toBeVisible({ timeout: 8000 })
    const requestBody = capturedBody as { credo?: unknown }
    expect(requestBody.credo).toBeDefined()
  })
})
