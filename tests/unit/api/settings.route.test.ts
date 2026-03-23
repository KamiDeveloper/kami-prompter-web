import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockCreateSupabaseServerClient,
  mockRequireAuth,
  mockGetUserSettings,
  mockUpdateUserSettings,
  MockAuthError,
} = vi.hoisted(() => ({
  mockCreateSupabaseServerClient: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockGetUserSettings: vi.fn(),
  mockUpdateUserSettings: vi.fn(),
  MockAuthError: class MockAuthError extends Error {
    constructor(message = 'Unauthorized') {
      super(message)
      this.name = 'AuthError'
    }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
}))

vi.mock('@/lib/services/auth.service', () => ({
  requireAuth: mockRequireAuth,
  AuthError: MockAuthError,
}))

vi.mock('@/lib/services/settings.service', () => ({
  getUserSettings: mockGetUserSettings,
  updateUserSettings: mockUpdateUserSettings,
}))

import { GET, PATCH } from '@/app/api/user/settings/route'

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/user/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/user/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123' })
  })

  it('retorna 401 sin auth', async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError())

    const response = await GET()

    expect(response.status).toBe(401)
  })

  it('retorna settings cuando auth es valida', async () => {
    const settings = { theme: 'dark' }
    mockGetUserSettings.mockResolvedValueOnce(settings)

    const response = await GET()

    expect(mockGetUserSettings).toHaveBeenCalledWith(expect.anything(), 'user-123')
    expect(response.status).toBe(200)
    const body = (await response.json()) as { data: { theme: string } }
    expect(body.data.theme).toBe('dark')
  })

  it('retorna 500 cuando getUserSettings falla', async () => {
    mockGetUserSettings.mockRejectedValueOnce(new Error('db fail'))

    const response = await GET()

    expect(response.status).toBe(500)
  })
})

describe('PATCH /api/user/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123' })
  })

  it('retorna 400 con body invalido', async () => {
    const response = await PATCH(createRequest({ default_model: 'invalid_value' }))

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: string; details: unknown }
    expect(body.error).toBe('Invalid request')
    expect(body.details).toBeDefined()
  })

  it('retorna 200 con body parcial valido', async () => {
    mockUpdateUserSettings.mockResolvedValueOnce({ theme: 'light' })

    const response = await PATCH(createRequest({ theme: 'light' }))

    expect(mockUpdateUserSettings).toHaveBeenCalledWith(expect.anything(), 'user-123', { theme: 'light' })
    expect(response.status).toBe(200)
    const body = (await response.json()) as { data: { theme: string } }
    expect(body.data.theme).toBe('light')
  })

  it('retorna 200 con todos los campos permitidos', async () => {
    const validPayload = {
      default_model: 'pro',
      default_thinking_level: 'HIGH',
      use_paid_key_for_all: true,
      show_nsfw: false,
      theme: 'dark',
      prd_default_detail: 'exhaustive',
      prd_default_language: 'es',
    }
    mockUpdateUserSettings.mockResolvedValueOnce(validPayload)

    const response = await PATCH(createRequest(validPayload))

    expect(mockUpdateUserSettings).toHaveBeenCalledWith(expect.anything(), 'user-123', validPayload)
    expect(response.status).toBe(200)
  })

  it('ignora campos no permitidos', async () => {
    mockUpdateUserSettings.mockResolvedValueOnce({ default_model: 'flash' })

    await PATCH(createRequest({ malicious_field: 'hack', default_model: 'flash' }))

    expect(mockUpdateUserSettings).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({ default_model: 'flash' }),
    )
    const updateArgs = mockUpdateUserSettings.mock.calls[0][2] as Record<string, unknown>
    expect(updateArgs.malicious_field).toBeUndefined()
  })
})
