import type { Page } from '@playwright/test'

export async function loginWithCredentials(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/app/dashboard', { timeout: 10000 })
}

export async function saveAuthState(page: Page, email: string, password: string, storageFile: string) {
  await loginWithCredentials(page, email, password)
  await page.context().storageState({ path: storageFile })
}
