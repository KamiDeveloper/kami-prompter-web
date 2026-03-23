export const TEST_USER = {
  email: `test-${Date.now()}@kamiprompter.test`,
  password: 'TestPass123!',
  name: 'Test User',
}

export const TEST_USER_WITH_KEYS = {
  email: process.env.E2E_TEST_USER_EMAIL ?? '',
  password: process.env.E2E_TEST_USER_PASSWORD ?? '',
}
