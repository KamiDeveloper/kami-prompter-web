import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth-state.json' })
const hasAuthEnv = Boolean(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD)
test.skip(!hasAuthEnv, 'Variables E2E_TEST_USER_* no configuradas')

test.describe('Sistema de Plantillas', () => {
  const mockTemplates = [
    {
      id: 'tpl-1',
      name: 'Mi plantilla de prueba',
      description: 'Descripcion de prueba',
      is_nsfw: false,
      category_id: 'cat-1',
      category: { id: 'cat-1', name: 'Codigo', emoji: '💻' },
      tags: [{ tag: 'python', created_by: 'user' }],
      branches: [{ id: 'br-1', name: 'main', is_main: true, parent_branch_id: null, updated_at: '2026-03-22T00:00:00Z' }],
      main_branch_content: 'Actua como experto en Python...',
      created_at: '2026-03-22T00:00:00Z',
      updated_at: '2026-03-22T00:00:00Z',
    },
  ]

  test('lista de plantillas carga correctamente', async ({ page }) => {
    await page.route('/api/templates*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockTemplates }),
      }),
    )
    await page.route('/api/categories*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      }),
    )

    await page.goto('/app/templates')
    await expect(page.getByText('Mi plantilla de prueba')).toBeVisible({ timeout: 5000 })
  })

  test('estado vacio cuando no hay plantillas', async ({ page }) => {
    await page.route('/api/templates*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      }),
    )
    await page.route('/api/categories*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      }),
    )

    await page.goto('/app/templates')
    await expect(page.getByText(/no hay plantillas|sin plantillas|crea/i)).toBeVisible({ timeout: 5000 })
  })

  test('busqueda llama API con searchQuery', async ({ page }) => {
    let lastUrl = ''
    await page.route('/api/templates*', (route) => {
      lastUrl = route.request().url()
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    })
    await page.route('/api/categories*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      }),
    )

    await page.goto('/app/templates')
    await page.locator('input[placeholder*="buscar" i]').fill('python')
    await page.waitForTimeout(600)

    expect(lastUrl).toContain('searchQuery=python')
  })

  test('navega a /templates/new al click en Nueva Plantilla', async ({ page }) => {
    await page.route('/api/templates*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      }),
    )
    await page.route('/api/categories*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      }),
    )

    await page.goto('/app/templates')
    await page.getByRole('button', { name: /nuevo template|nueva plantilla|new template/i }).click()
    await expect(page).toHaveURL(/\/templates\/new/)
  })
})
