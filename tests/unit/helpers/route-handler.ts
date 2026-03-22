import { vi } from 'vitest'

import { createMockSupabaseClient } from '@/tests/unit/helpers/supabase-mock'

/**
 * Mockea el modulo de servidor de Supabase para tests de Route Handlers.
 * @param overrides Configuracion opcional de sesion y cliente de servicio.
 * @returns Clientes mock usados por el modulo mockeado.
 */
export function mockSupabaseServerModule(overrides: {
  session?: { user: { id: string; email: string } } | null
  serviceClient?: ReturnType<typeof createMockSupabaseClient>
}) {
  const serverClient = createMockSupabaseClient()
  const serviceClient = overrides.serviceClient ?? createMockSupabaseClient()

  const session = overrides.session ?? null
  const sessionMock = vi.fn(async () => ({ data: { session }, error: null }))
  const userMock = vi.fn(async () => ({ data: { user: session?.user ?? null }, error: null }))

  ;(serverClient as unknown as { auth: { getSession: typeof sessionMock; getUser: typeof userMock } }).auth.getSession =
    sessionMock
  ;(serverClient as unknown as { auth: { getSession: typeof sessionMock; getUser: typeof userMock } }).auth.getUser =
    userMock

  vi.doMock('@/lib/supabase/server', () => ({
    createSupabaseServerClient: vi.fn().mockResolvedValue(serverClient),
    createSupabaseServiceRoleClient: vi.fn().mockReturnValue(serviceClient),
  }))

  return { serverClient, serviceClient }
}

/**
 * Crea una Request mock para invocar Route Handlers de Next.
 * @param body Cuerpo serializable de la request.
 * @param options Metodo y headers opcionales.
 * @returns Instancia de Request lista para test.
 */
export function createMockRequest(
  body: unknown,
  options?: {
    method?: string
    headers?: Record<string, string>
  },
): Request {
  return new Request('http://localhost/api/test', {
    method: options?.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(body),
  })
}
