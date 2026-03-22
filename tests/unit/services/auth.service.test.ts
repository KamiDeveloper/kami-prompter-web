import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthError, getServerSession, requireAuth } from '@/lib/services/auth.service'
import { createMockSupabaseClient, type MockSupabaseClient } from '@/tests/unit/helpers/supabase-mock'

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getServerSession retorna sesión cuando existe', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.auth.getSession.mockResolvedValueOnce({
      data: { session: { access_token: 'token', user: { id: 'u1' } } },
      error: null,
    })

    const session = await getServerSession(client)
    expect(session).toMatchObject({ access_token: 'token' })
  })

  it('getServerSession retorna null cuando session es null', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })

    const session = await getServerSession(client)
    expect(session).toBeNull()
  })

  it('getServerSession retorna null cuando hay error', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'error' },
    })

    const session = await getServerSession(client)
    expect(session).toBeNull()
  })

  it('requireAuth retorna usuario cuando existe', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'qa@test.dev' } },
      error: null,
    })

    const user = await requireAuth(client)
    expect(user).toMatchObject({ id: 'u1', email: 'qa@test.dev' })
  })

  it('requireAuth lanza AuthError cuando no hay usuario', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    await expect(requireAuth(client)).rejects.toBeInstanceOf(AuthError)
  })

  it('requireAuth lanza instancia AuthError', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'x' } })

    try {
      await requireAuth(client)
      throw new Error('Expected AuthError')
    } catch (error: unknown) {
      expect(error instanceof AuthError).toBe(true)
    }
  })
})
