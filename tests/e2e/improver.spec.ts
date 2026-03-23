import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth-state.json' })
const hasAuthEnv = Boolean(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD)
test.skip(!hasAuthEnv, 'Variables E2E_TEST_USER_* no configuradas')

test.describe('Modulo Improver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/improver')
  })

  test('carga con textarea vacio y boton deshabilitado', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEmpty()

    const improveBtn = page.getByRole('button', { name: /mejorar/i })
    await expect(improveBtn).toBeDisabled()
  })

  test('el boton se habilita cuando hay texto', async ({ page }) => {
    await page.locator('textarea').first().fill('Este es un prompt de prueba para mejorar.')
    const improveBtn = page.getByRole('button', { name: /mejorar/i })
    await expect(improveBtn).toBeEnabled()
  })

  test('Ctrl+Enter dispara analisis', async ({ page }) => {
    await page.route('/api/ai/improve', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            originalPrompt: 'prompt test',
            improvedPrompt: 'prompt mejorado',
            changes: [{ vector: 'Claridad', description: 'Anadido contexto', type: 'addition' }],
          },
        }),
      }),
    )

    await page.locator('textarea').first().fill('prompt test')
    await page.locator('textarea').first().press('Control+Enter')

    await expect(page.getByText('prompt mejorado')).toBeVisible({ timeout: 8000 })
  })

  test('muestra diff view con resultado', async ({ page }) => {
    await page.route('/api/ai/improve', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            originalPrompt: 'Escribe un email.',
            improvedPrompt: 'Redacta un email profesional de seguimiento.',
            changes: [
              { vector: 'Especificidad', description: 'Anadido tipo y proposito', type: 'addition' },
            ],
          },
        }),
      }),
    )

    await page.locator('textarea').first().fill('Escribe un email.')
    await page.getByRole('button', { name: /mejorar/i }).click()

    await expect(page.getByText('Prompt Mejorado')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Redacta un email')).toBeVisible()
  })

  test('selector de thinking level cambia estado activo', async ({ page }) => {
    const highBtn = page.getByRole('button', { name: /profundo|high/i })
    await expect(highBtn).toBeVisible()
    await highBtn.click()
    await expect(highBtn).toHaveClass(/accent|text-accent/)
  })

  test('boton Copiar funciona tras resultado', async ({ page }) => {
    await page.route('/api/ai/improve', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            originalPrompt: 'test',
            improvedPrompt: 'Texto mejorado para copiar',
            changes: [],
          },
        }),
      }),
    )

    await page.locator('textarea').first().fill('test')
    await page.getByRole('button', { name: /mejorar/i }).click()
    await expect(page.getByText('Texto mejorado')).toBeVisible({ timeout: 8000 })

    await page.getByRole('button', { name: /copiar/i }).first().click()
    await expect(page.getByText(/copiado/i)).toBeVisible({ timeout: 3000 })
  })

  test('muestra toast error cuando falta API key', async ({ page }) => {
    await page.route('/api/ai/improve', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API_KEY_NOT_CONFIGURED', keyType: 'flash_free' }),
      }),
    )

    await page.locator('textarea').first().fill('test prompt')
    await page.getByRole('button', { name: /mejorar/i }).click()

    await expect(page.getByText(/api key|configuracion|settings/i)).toBeVisible({ timeout: 5000 })
  })
})
