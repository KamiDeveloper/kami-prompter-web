import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockRequest } from '@/tests/unit/helpers/route-handler'

const {
  mockCreateSupabaseServerClient,
  mockCreateSupabaseServiceRoleClient,
  mockRequireAuth,
  mockResolveApiKey,
  mockSaveToHistory,
  mockGenerateContent,
  MockAuthError,
} = vi.hoisted(() => ({
  mockCreateSupabaseServerClient: vi.fn(),
  mockCreateSupabaseServiceRoleClient: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockResolveApiKey: vi.fn(),
  mockSaveToHistory: vi.fn(),
  mockGenerateContent: vi.fn(),
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
  resolveApiKey: mockResolveApiKey,
}))

vi.mock('@/lib/services/history.service', () => ({
  saveToHistory: mockSaveToHistory,
}))

vi.mock('@/lib/ai/gemini-client', () => ({
  GeminiClient: class MockGeminiClient {
    generateContent = mockGenerateContent
  },
  getModelString: vi.fn((model: 'flash' | 'pro') =>
    model === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
  ),
}))

import { POST } from '@/app/api/ai/improve/route'

describe('POST /api/ai/improve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockCreateSupabaseServiceRoleClient.mockReturnValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123', email: 'test@test.com' })
  })

  const validBody = {
    prompt: 'Este prompt tiene suficiente longitud para validar',
    interventionLevel: 'moderate',
    model: 'flash',
    thinkingLevel: 'MEDIUM',
  } as const

  it('retorna 400 cuando la request es inválida', async () => {
    const response = await POST(createMockRequest({ prompt: 'short' }))
    expect(response.status).toBe(400)
  })

  it('retorna 401 cuando no hay autenticación', async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError('Unauthorized'))

    const response = await POST(createMockRequest(validBody))
    expect(response.status).toBe(401)
  })

  it('retorna 422 cuando API key no está configurada', async () => {
    mockResolveApiKey.mockResolvedValueOnce(null)

    const response = await POST(createMockRequest(validBody))
    expect(response.status).toBe(422)

    const data = (await response.json()) as { error: string; keyType: string }
    expect(data.error).toBe('API_KEY_NOT_CONFIGURED')
    expect(data.keyType).toBeDefined()
  })

  it('retorna 200 con payload correcto cuando la ejecución es exitosa', async () => {
    mockResolveApiKey.mockResolvedValueOnce({ apiKey: 'test-key', keyType: 'flash_free' })
    mockGenerateContent.mockResolvedValueOnce(
      JSON.stringify({
        improvedPrompt: 'improved text',
        changes: [{ vector: 'Claridad', description: 'Added context', type: 'addition' }],
      }),
    )

    const response = await POST(createMockRequest(validBody))
    expect(response.status).toBe(200)

    const data = (await response.json()) as {
      data: { improvedPrompt: string; changes: unknown[] }
    }

    expect(data.data.improvedPrompt).toBe('improved text')
    expect(data.data.changes).toHaveLength(1)
  })

  it('guarda en historial cuando la respuesta es exitosa', async () => {
    mockResolveApiKey.mockResolvedValueOnce({ apiKey: 'test-key', keyType: 'flash_free' })
    mockGenerateContent.mockResolvedValueOnce(
      JSON.stringify({ improvedPrompt: 'improved text', changes: [] }),
    )

    await POST(createMockRequest(validBody))

    expect(mockSaveToHistory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        user_id: 'user-123',
        module: 'improver',
      }),
    )
  })

  it('retorna 500 genérico cuando GeminiClient falla', async () => {
    mockResolveApiKey.mockResolvedValueOnce({ apiKey: 'test-key', keyType: 'flash_free' })
    mockGenerateContent.mockRejectedValueOnce({ code: 'SERVER_ERROR', message: 'boom' })

    const response = await POST(createMockRequest(validBody))
    expect(response.status).toBe(500)

    const data = (await response.json()) as { error: string }
    expect(data.error).toBe('Internal server error')
  })
})
