import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockRequest } from '@/tests/unit/helpers/route-handler'

const {
  mockCreateSupabaseServerClient,
  mockCreateSupabaseServiceRoleClient,
  mockRequireAuth,
  mockStoreApiKey,
  MockAuthError,
} = vi.hoisted(() => ({
  mockCreateSupabaseServerClient: vi.fn(),
  mockCreateSupabaseServiceRoleClient: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockStoreApiKey: vi.fn(),
  MockAuthError: class MockAuthError extends Error {
    constructor(message = 'Unauthorized') {
      super(message)
      this.name = 'AuthError'
    }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
  createSupabaseServiceRoleClient: mockCreateSupabaseServiceRoleClient,
}))

vi.mock('@/lib/services/auth.service', () => ({
  requireAuth: mockRequireAuth,
  AuthError: MockAuthError,
}))

vi.mock('@/lib/vault/api-keys', () => ({
  storeApiKey: mockStoreApiKey,
}))

import { POST } from '@/app/api/keys/store/route'

describe('POST /api/keys/store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockCreateSupabaseServiceRoleClient.mockReturnValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123', email: 'test@test.com' })
  })

  it('retorna 400 cuando falta keyType', async () => {
    const response = await POST(createMockRequest({ apiKey: 'valid-key-12345' }))
    expect(response.status).toBe(400)
  })

  it('retorna 400 cuando apiKey es muy corta', async () => {
    const response = await POST(createMockRequest({ keyType: 'flash_free', apiKey: 'short' }))
    expect(response.status).toBe(400)
  })

  it('retorna 400 cuando keyType es inválido', async () => {
    const response = await POST(createMockRequest({ keyType: 'invalid', apiKey: 'valid-key-12345' }))
    expect(response.status).toBe(400)
  })

  it('retorna 401 cuando no hay autenticación', async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError('Unauthorized'))

    const response = await POST(createMockRequest({ keyType: 'flash_free', apiKey: 'valid-key-12345' }))
    expect(response.status).toBe(401)
  })

  it('retorna 200 en store exitoso y no expone apiKey', async () => {
    mockStoreApiKey.mockResolvedValueOnce({ success: true })

    const response = await POST(createMockRequest({ keyType: 'flash_free', apiKey: 'valid-key-12345' }))
    expect(response.status).toBe(200)

    const data = (await response.json()) as { success: boolean }
    expect(data.success).toBe(true)
    expect(JSON.stringify(data)).not.toContain('valid-key-12345')
  })

  it('retorna 500 genérico cuando falla vault', async () => {
    mockStoreApiKey.mockResolvedValueOnce({ success: false, error: 'Vault connection failed' })

    const response = await POST(createMockRequest({ keyType: 'pro_paid', apiKey: 'valid-key-12345' }))
    expect(response.status).toBe(500)

    const data = (await response.json()) as { error: string }
    expect(data.error).toBe('Unable to store API key')
    expect(data.error).not.toContain('Vault connection failed')
  })
})
