import { chromium, type FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD

  if (!email || !password) {
    console.warn('⚠️  E2E_TEST_USER_* no configuradas. Tests de auth se saltaran.')
    return
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    const baseURL = typeof config.projects[0]?.use?.baseURL === 'string'
      ? config.projects[0].use.baseURL
      : 'http://localhost:3000'

    await page.goto(`${baseURL}/login`)
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/app/dashboard', { timeout: 15000 })
    await page.context().storageState({ path: 'tests/e2e/.auth-state.json' })
    console.log('✅ Auth state guardado para E2E tests')
  } catch (err) {
    console.error('❌ Error en global setup de auth:', err)
  } finally {
    await browser.close()
  }
}

export default globalSetup
