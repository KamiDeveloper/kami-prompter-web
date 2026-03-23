import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockCreateSupabaseServerClient,
  mockRequireAuth,
  mockGetTemplates,
  mockCreateTemplate,
  MockAuthError,
} = vi.hoisted(() => ({
  mockCreateSupabaseServerClient: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockGetTemplates: vi.fn(),
  mockCreateTemplate: vi.fn(),
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
  getTemplates: mockGetTemplates,
  createTemplate: mockCreateTemplate,
}))

import { GET, POST } from '@/app/api/templates/route'

function createGetRequest(url: string): Request {
  return new Request(url, { method: 'GET' })
}

function createPostRequest(body: unknown): Request {
  return new Request('http://localhost/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/templates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123' })
  })

  it('retorna 401 sin auth', async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError())

    const response = await GET(createGetRequest('http://localhost/api/templates'))

    expect(response.status).toBe(401)
  })

  it('aplica filtros en query params', async () => {
    mockGetTemplates.mockResolvedValueOnce([])

    const response = await GET(
      createGetRequest('http://localhost/api/templates?categoryId=cat-1&searchQuery=python&orderBy=name&orderDirection=asc'),
    )

    expect(mockGetTemplates).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({
        categoryId: 'cat-1',
        searchQuery: 'python',
        orderBy: 'name',
        orderDirection: 'asc',
      }),
    )
    expect(response.status).toBe(200)
  })

  it('mapea showNsfw=true correctamente', async () => {
    mockGetTemplates.mockResolvedValueOnce([])

    await GET(createGetRequest('http://localhost/api/templates?showNsfw=true'))

    expect(mockGetTemplates).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({ showNsfw: true }),
    )
  })

  it('retorna data de templates con 200', async () => {
    mockGetTemplates.mockResolvedValueOnce([{ id: 'tpl-1' }])

    const response = await GET(createGetRequest('http://localhost/api/templates'))

    expect(response.status).toBe(200)
    const body = (await response.json()) as { data: Array<{ id: string }> }
    expect(body.data[0].id).toBe('tpl-1')
  })
})

describe('POST /api/templates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseServerClient.mockResolvedValue({})
    mockRequireAuth.mockResolvedValue({ id: 'user-123' })
  })

  it('body minimo valido retorna 200', async () => {
    const payload = {
      name: 'Mi plantilla',
      initialContent: 'Actua como...',
    }
    mockCreateTemplate.mockResolvedValueOnce({
      template: { id: 'tpl-1' },
      mainBranch: { id: 'br-1' },
    })

    const response = await POST(createPostRequest(payload))

    expect(mockCreateTemplate).toHaveBeenCalledWith(expect.anything(), 'user-123', payload)
    expect(response.status).toBe(200)
  })

  it('sin name retorna 400', async () => {
    const response = await POST(createPostRequest({ initialContent: 'contenido' }))

    expect(response.status).toBe(400)
  })

  it('sin initialContent retorna 400', async () => {
    const response = await POST(createPostRequest({ name: 'Template' }))

    expect(response.status).toBe(400)
  })

  it('con tags y category_id llama createTemplate con todos los campos', async () => {
    const payload = {
      name: 'Template tags',
      initialContent: 'Contenido',
      category_id: '11111111-1111-4111-8111-111111111111',
      tags: ['tag1', 'tag2'],
    }
    mockCreateTemplate.mockResolvedValueOnce({
      template: { id: 'tpl-2' },
      mainBranch: { id: 'br-2' },
    })

    await POST(createPostRequest(payload))

    expect(mockCreateTemplate).toHaveBeenCalledWith(expect.anything(), 'user-123', payload)
  })
})
