import type { SupabaseClient } from '@supabase/supabase-js'
import { vi } from 'vitest'

import type { Database } from '@/types'

type SupabaseError = { message: string; code?: string }

type SupabaseResponse<T> = {
  data: T | null
  error: SupabaseError | null
  count?: number | null
}

type BuilderTerminalResult = SupabaseResponse<unknown>

// Helper type: extract the async executor from a vi.fn so it can be called safely
type ExecutorFn = () => Promise<BuilderTerminalResult>

export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  execute: ReturnType<typeof vi.fn>
  // Use Promise (not PromiseLike) so .catch and .finally are available
  then: Promise<BuilderTerminalResult>['then']
  catch: Promise<BuilderTerminalResult>['catch']
  finally: Promise<BuilderTerminalResult>['finally']
}

function createMockQueryBuilder(): MockQueryBuilder {
  const defaultResult: BuilderTerminalResult = { data: [], error: null, count: 0 }

  const builder = {} as MockQueryBuilder

  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.in = vi.fn(() => builder)
  builder.or = vi.fn(() => builder)
  builder.order = vi.fn(() => builder)
  builder.range = vi.fn(() => builder)
  builder.insert = vi.fn(() => builder)
  builder.update = vi.fn(() => builder)
  builder.delete = vi.fn(() => builder)
  builder.upsert = vi.fn(() => builder)

  builder.single = vi.fn(async () => defaultResult)
  builder.maybeSingle = vi.fn(async () => defaultResult)
  builder.execute = vi.fn(async () => defaultResult)

  // Cast execute to a plain callable before passing to Promise.resolve,
  // avoiding the "Mock<Procedure | Constructable> is not callable" TS error.
  const callExecute = (): Promise<BuilderTerminalResult> =>
    (builder.execute as unknown as ExecutorFn)()

  builder.then = (onfulfilled, onrejected) =>
    Promise.resolve(callExecute()).then(onfulfilled, onrejected)

  builder.catch = <TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null | undefined,
  ) => Promise.resolve(callExecute()).catch(onrejected)

  builder.finally = (onfinally?: (() => void) | null | undefined) =>
    Promise.resolve(callExecute()).finally(onfinally)

  return builder
}

export type MockSupabaseClient = SupabaseClient<Database> & {
  __mock: {
    builders: MockQueryBuilder[]
    createBuilder: () => MockQueryBuilder
    from: ReturnType<typeof vi.fn>
    rpc: ReturnType<typeof vi.fn>
    auth: {
      getSession: ReturnType<typeof vi.fn>
      getUser: ReturnType<typeof vi.fn>
    }
  }
}

/**
 * Crea un mock de Supabase con builder pattern encadenable y terminales configurables.
 * @param overrides Personalizacion opcional de from/rpc/auth.
 * @returns Cliente Supabase mockeado para tests unitarios.
 */
export function createMockSupabaseClient(overrides?: {
  from?: ReturnType<typeof vi.fn>
  rpc?: ReturnType<typeof vi.fn>
  auth?: Partial<SupabaseClient<Database>['auth']>
}): SupabaseClient<Database> {
  const builders: MockQueryBuilder[] = []

  const createBuilder = () => {
    const builder = createMockQueryBuilder()
    builders.push(builder)
    return builder
  }

  const from =
    overrides?.from ??
    vi.fn(() => {
      return createBuilder() as unknown
    })

  const rpc =
    overrides?.rpc ??
    vi.fn(async () => {
      return mockSupabaseSuccess(null)
    })

  const getSession = vi.fn(async () => ({ data: { session: null }, error: null }))
  const getUser = vi.fn(async () => ({ data: { user: null }, error: null }))

  const auth = {
    ...(overrides?.auth ?? {}),
    getSession: (overrides?.auth?.getSession as typeof getSession | undefined) ?? getSession,
    getUser: (overrides?.auth?.getUser as typeof getUser | undefined) ?? getUser,
  }

  const client = {
    from,
    rpc,
    auth,
    __mock: {
      builders,
      createBuilder,
      from,
      rpc,
      auth: {
        getSession,
        getUser,
      },
    },
  }

  return client as unknown as SupabaseClient<Database>
}

/**
 * Construye respuesta exitosa estilo Supabase.
 * @param data Payload de datos.
 * @returns Objeto con data y error nulo.
 */
export function mockSupabaseSuccess<T>(data: T) {
  return { data, error: null }
}

/**
 * Construye respuesta con error estilo Supabase.
 * @param message Mensaje de error.
 * @param code Codigo opcional.
 * @returns Objeto con data null y error serializable.
 */
export function mockSupabaseError(message: string, code?: string) {
  return {
    data: null,
    error: { message, code: code ?? 'PGRST116' },
  }
}