import { test, expect } from '@playwright/test'

test.describe('Autenticacion', () => {
  test('landing page es accesible sin autenticacion', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Kami Prompter/)
    const cta = page.getByRole('link', { name: /comenzar|iniciar/i }).first()
    await expect(cta).toBeVisible()
  })

  test('redirige a /login cuando se accede a /app sin auth', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login con credenciales invalidas muestra error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    const toastItem = page.locator('[aria-live="polite"] > *').first()
    await expect(toastItem).toBeVisible({ timeout: 5000 })
  })

  test('login exitoso redirige a /app/dashboard', async ({ page }) => {
    const email = process.env.E2E_TEST_USER_EMAIL
    const password = process.env.E2E_TEST_USER_PASSWORD
    test.skip(!email || !password, 'Variables E2E_TEST_USER_* no configuradas')

    await page.goto('/login')
    await page.fill('input[type="email"]', email || '')
    await page.fill('input[type="password"]', password || '')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/app/dashboard', { timeout: 10000 })
  })

  test('ruta /forgot-password es accesible', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/contrasena|contraseña|password/i)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('register page muestra formulario completo', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('logout funciona correctamente', async ({ page }) => {
    const email = process.env.E2E_TEST_USER_EMAIL
    const password = process.env.E2E_TEST_USER_PASSWORD
    test.skip(!email || !password, 'Variables E2E no configuradas')

    await page.goto('/login')
    await page.fill('input[type="email"]', email || '')
    await page.fill('input[type="password"]', password || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/app/dashboard')

    await page.getByRole('button', { name: /cerrar sesion|logout|sign out/i }).click()
    await expect(page).toHaveURL(/\/login|\/$/)
  })
})
