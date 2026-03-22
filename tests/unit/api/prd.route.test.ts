import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockRequest } from '@/tests/unit/helpers/route-handler'

const {
  mockCreateSupabaseServerClient,
  mockCreateSupabaseServiceRoleClient,
  mockRequireAuth,
  mockResolveApiKey,
  mockSaveToHistory,
  mockGenerateContentStream,
  MockAuthError,
} = vi.hoisted(() => ({
  mockCreateSupabaseServerClient: vi.fn(),
  mockCreateSupabaseServiceRoleClient: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockResolveApiKey: vi.fn(),
  mockSaveToHistory: vi.fn(),
  mockGenerateContentStream: vi.fn(),
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
    generateContentStream = mockGenerateContentStream
  },
  getModelString: vi.fn((model: 'flash' | 'pro') =>
    model === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
  ),
}))

import { POST } from '@/app/api/ai/prd/route'

describe('POST /api/ai/prd', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockCreateSupabaseServiceRoleClient.mockReturnValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123', email: 'test@test.com' })
  })

  const validBody = {
    description: 'Descripción suficientemente larga para generar un PRD de prueba robusto.',
    detailLevel: 'standard',
    language: 'es',
    model: 'pro',
    thinkingLevel: 'HIGH',
  } as const

  it('retorna 400 si falta description', async () => {
    const response = await POST(createMockRequest({ ...validBody, description: undefined }))
    expect(response.status).toBe(400)
  })

  it('retorna 400 si description tiene menos de 20 caracteres', async () => {
    const response = await POST(createMockRequest({ ...validBody, description: 'muy corto' }))
    expect(response.status).toBe(400)
  })

  it('retorna 400 con detailLevel inválido', async () => {
    const response = await POST(createMockRequest({ ...validBody, detailLevel: 'invalid' }))
    expect(response.status).toBe(400)
  })

  it('retorna 401 sin autenticación', async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError('Unauthorized'))

    const response = await POST(createMockRequest(validBody))
    expect(response.status).toBe(401)
  })

  it('retorna 422 cuando no hay API key configurada', async () => {
    mockResolveApiKey.mockResolvedValueOnce(null)

    const response = await POST(createMockRequest(validBody))
    expect(response.status).toBe(422)
  })

  it('retorna stream exitoso y contenido concatenado', async () => {
    mockResolveApiKey.mockResolvedValueOnce({ apiKey: 'test-key', keyType: 'pro_paid' })

    async function* mockStream() {
      yield '# PRD\n'
      yield '## Visión General\n'
      yield 'Contenido del PRD...'
    }

    mockGenerateContentStream.mockReturnValueOnce(mockStream())

    const response = await POST(createMockRequest(validBody))
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/plain')

    const text = await response.text()
    expect(text).toContain('# PRD')
    expect(text).toContain('## Visión General')
  })

  it('guarda en historial al completar stream', async () => {
    mockResolveApiKey.mockResolvedValueOnce({ apiKey: 'test-key', keyType: 'pro_paid' })

    async function* mockStream() {
      yield 'parte 1\n'
      yield 'parte 2\n'
    }

    mockGenerateContentStream.mockReturnValueOnce(mockStream())

    const response = await POST(createMockRequest(validBody))
    await response.text()

    expect(mockSaveToHistory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ module: 'prd', thinking_level: 'HIGH' }),
    )
  })
})
