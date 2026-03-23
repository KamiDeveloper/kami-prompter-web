import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth-state.json' })
const hasAuthEnv = Boolean(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD)
test.skip(!hasAuthEnv, 'Variables E2E_TEST_USER_* no configuradas')

test.describe('Modulo PRD Maker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/prd')
  })

  test('muestra textarea y boton generar deshabilitado si vacio', async ({ page }) => {
    await expect(page.locator('textarea').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /generar|generate/i })).toBeDisabled()
  })

  test('streaming muestra contenido progresivo', async ({ page }) => {
    const chunks = ['# PRD de Prueba\n', '## Resumen\n', 'Este es el contenido del PRD generado.\n']

    await page.route('/api/ai/prd', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: chunks.join(''),
      })
    })

    await page.locator('textarea').first().fill('Descripcion de producto para test con mas de 20 caracteres.')
    await page.getByRole('button', { name: /generar|generate/i }).click()

    await expect(page.getByText('# PRD de Prueba')).toBeVisible({ timeout: 10000 })
  })

  test('boton Exportar .md aparece tras generar', async ({ page }) => {
    await page.route('/api/ai/prd', (route) =>
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: '# PRD Generado\n## Resumen\nContenido del PRD.',
      }),
    )

    await page.locator('textarea').first().fill('Descripcion suficientemente larga para pasar validacion.')
    await page.getByRole('button', { name: /generar/i }).click()

    await expect(page.getByRole('button', { name: /exportar|export|\.md|descargar/i })).toBeVisible({ timeout: 10000 })
  })
})
