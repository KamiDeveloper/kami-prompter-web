import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockCreateSupabaseServerClient,
  mockRequireAuth,
  mockGetTemplateById,
  mockUpdateTemplate,
  mockSoftDeleteTemplate,
  MockAuthError,
} = vi.hoisted(() => ({
  mockCreateSupabaseServerClient: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockGetTemplateById: vi.fn(),
  mockUpdateTemplate: vi.fn(),
  mockSoftDeleteTemplate: vi.fn(),
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

vi.mock('@/lib/services/templates.service', () => ({
  getTemplateById: mockGetTemplateById,
  updateTemplate: mockUpdateTemplate,
  softDeleteTemplate: mockSoftDeleteTemplate,
}))

import { DELETE, GET, PATCH } from '@/app/api/templates/[id]/route'

function createPatchRequest(body: unknown): Request {
  return new Request('http://localhost/api/templates/tpl-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/templates/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123' })
  })

  it('GET sin auth retorna 401', async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError())

    const response = await GET(new Request('http://localhost/api/templates/tpl-1'), {
      params: Promise.resolve({ id: 'tpl-1' }),
    })

    expect(response.status).toBe(401)
  })

  it('GET con id retorna 200', async () => {
    mockGetTemplateById.mockResolvedValueOnce({ id: 'tpl-1' })

    const response = await GET(new Request('http://localhost/api/templates/tpl-1'), {
      params: Promise.resolve({ id: 'tpl-1' }),
    })

    expect(mockGetTemplateById).toHaveBeenCalledWith(expect.anything(), 'tpl-1', 'user-123')
    expect(response.status).toBe(200)
  })

  it('GET template no encontrado retorna 500 o 404', async () => {
    mockGetTemplateById.mockRejectedValueOnce(new Error('Template not found'))

    const response = await GET(new Request('http://localhost/api/templates/tpl-missing'), {
      params: Promise.resolve({ id: 'tpl-missing' }),
    })

    expect([404, 500]).toContain(response.status)
  })

  it('PATCH parcial llama updateTemplate con campos correctos', async () => {
    mockUpdateTemplate.mockResolvedValueOnce({ id: 'tpl-1', name: 'Nuevo nombre' })

    const response = await PATCH(createPatchRequest({ name: 'Nuevo nombre' }), {
      params: Promise.resolve({ id: 'tpl-1' }),
    })

    expect(mockUpdateTemplate).toHaveBeenCalledWith(
      expect.anything(),
      'tpl-1',
      'user-123',
      expect.objectContaining({ name: 'Nuevo nombre' }),
    )
    expect(response.status).toBe(200)
  })

  it('DELETE llama softDeleteTemplate y retorna success', async () => {
    mockSoftDeleteTemplate.mockResolvedValueOnce(undefined)

    const response = await DELETE(new Request('http://localhost/api/templates/tpl-1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'tpl-1' }),
    })

    expect(mockSoftDeleteTemplate).toHaveBeenCalledWith(expect.anything(), 'tpl-1', 'user-123')
    expect(response.status).toBe(200)
    const body = (await response.json()) as { success: boolean }
    expect(body.success).toBe(true)
  })
})
