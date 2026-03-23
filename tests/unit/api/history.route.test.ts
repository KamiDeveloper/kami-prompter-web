import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockCreateSupabaseServerClient,
  mockRequireAuth,
  mockGetUserHistory,
  MockAuthError,
} = vi.hoisted(() => ({
  mockCreateSupabaseServerClient: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockGetUserHistory: vi.fn(),
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

vi.mock('@/lib/services/history.service', () => ({
  getUserHistory: mockGetUserHistory,
}))

import { GET } from '@/app/api/history/route'

function createGetRequest(url: string): Request {
  return new Request(url, { method: 'GET' })
}

describe('GET /api/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123' })
  })

  it('retorna 401 sin autenticacion', async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError())

    const response = await GET(createGetRequest('http://localhost/api/history'))

    expect(response.status).toBe(401)
    const body = (await response.json()) as { error: string }
    expect(body.error).toBe('Unauthorized')
  })

  it('retorna 200 con query params validos', async () => {
    const mockEntry = { id: 'h1', module: 'improver' }
    mockGetUserHistory.mockResolvedValueOnce({ data: [mockEntry], count: 1 })

    const response = await GET(createGetRequest('http://localhost/api/history?limit=5&offset=0'))

    expect(mockGetUserHistory).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({ limit: 5, offset: 0 }),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { data: Array<{ id: string }>; count: number }
    expect(body.data[0].id).toBe('h1')
    expect(body.count).toBe(1)
  })

  it('retorna 200 con filtro por modulo', async () => {
    mockGetUserHistory.mockResolvedValueOnce({ data: [{ id: 'h2', module: 'improver' }], count: 1 })

    const response = await GET(createGetRequest('http://localhost/api/history?module=improver&limit=10'))

    expect(mockGetUserHistory).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({ module: 'improver', limit: 10, offset: 0 }),
    )
    expect(response.status).toBe(200)
  })

  it('sin query params usa defaults', async () => {
    mockGetUserHistory.mockResolvedValueOnce({ data: [], count: 0 })

    await GET(createGetRequest('http://localhost/api/history'))

    expect(mockGetUserHistory).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({ limit: 20, offset: 0 }),
    )
  })

  it('modulo invalido se maneja gracefully', async () => {
    mockGetUserHistory.mockResolvedValueOnce({ data: [], count: 0 })

    const response = await GET(createGetRequest('http://localhost/api/history?module=invalid'))

    expect(response.status).toBe(200)
    expect(mockGetUserHistory).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({ module: undefined }),
    )
  })

  it('retorna 500 cuando getUserHistory falla', async () => {
    mockGetUserHistory.mockRejectedValueOnce(new Error('DB error'))

    const response = await GET(createGetRequest('http://localhost/api/history'))

    expect(response.status).toBe(500)
    const body = (await response.json()) as { error: string }
    expect(body.error).toBe('Internal server error')
  })
})
