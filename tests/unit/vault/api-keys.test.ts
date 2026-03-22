import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteApiKey, hasApiKey, resolveApiKey, retrieveApiKey, storeApiKey } from '@/lib/vault/api-keys'
import { createMockSupabaseClient, mockSupabaseError, mockSupabaseSuccess, type MockSupabaseClient } from '@/tests/unit/helpers/supabase-mock'

describe('vault/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('storeApiKey retorna success true cuando vault y upsert son exitosos', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseSuccess('secret-id-1'))

    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    client.__mock.from.mockImplementation((table: string) => {
      if (table === 'user_api_keys') {
        return userApiBuilder
      }
      return client.__mock.createBuilder()
    })

    const result = await storeApiKey({
      userId: 'u1',
      keyType: 'flash_free',
      apiKey: 'real-secret-key',
      serviceClient: client,
    })

    expect(result).toEqual({ success: true })
  })

  it('storeApiKey retorna error cuando vault.create_secret falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseError('vault fail'))

    const result = await storeApiKey({
      userId: 'u1',
      keyType: 'flash_free',
      apiKey: 'real-secret-key',
      serviceClient: client,
    })

    expect(result).toEqual({ success: false, error: 'Unable to store API key' })
  })

  it('storeApiKey hace rollback con vault.delete_secret cuando upsert falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseSuccess('secret-id-1')).mockResolvedValueOnce(mockSupabaseSuccess(true))

    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.execute.mockResolvedValueOnce(mockSupabaseError('upsert fail'))

    client.__mock.from.mockImplementation((table: string) => {
      if (table === 'user_api_keys') {
        return userApiBuilder
      }
      return client.__mock.createBuilder()
    })

    const result = await storeApiKey({
      userId: 'u1',
      keyType: 'pro_paid',
      apiKey: 'another-secret',
      serviceClient: client,
    })

    expect(result.success).toBe(false)
    expect(client.__mock.rpc).toHaveBeenNthCalledWith(2, 'vault.delete_secret', { secret_id: 'secret-id-1' })
  })

  it('storeApiKey no guarda apiKey en user_api_keys (solo vault_secret_id)', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseSuccess('secret-id-1'))

    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => userApiBuilder)

    await storeApiKey({
      userId: 'u1',
      keyType: 'flash_free',
      apiKey: 'real-secret-key',
      serviceClient: client,
    })

    const payload = userApiBuilder.upsert.mock.calls[0][0] as Record<string, unknown>
    expect(payload.vault_secret_id).toBe('secret-id-1')
    expect(payload.apiKey).toBeUndefined()
    expect(payload.secret).toBeUndefined()
  })

  it('retrieveApiKey retorna string cuando hay referencia y vault responde secreto', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient

    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ vault_secret_id: 'sec-1' }))
    client.__mock.from.mockImplementation(() => userApiBuilder)

    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseSuccess('secret-value'))

    const result = await retrieveApiKey({ userId: 'u1', keyType: 'flash_free', serviceClient: client })
    expect(result).toBe('secret-value')
  })

  it('retrieveApiKey retorna null cuando no hay referencia', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => userApiBuilder)

    const result = await retrieveApiKey({ userId: 'u1', keyType: 'flash_free', serviceClient: client })
    expect(result).toBeNull()
  })

  it('retrieveApiKey retorna null cuando vault falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ vault_secret_id: 'sec-1' }))
    client.__mock.from.mockImplementation(() => userApiBuilder)
    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseError('vault fail'))

    const result = await retrieveApiKey({ userId: 'u1', keyType: 'flash_free', serviceClient: client })
    expect(result).toBeNull()
  })

  it('hasApiKey retorna true cuando existe referencia', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ id: 'k1' }))
    client.__mock.from.mockImplementation(() => userApiBuilder)

    const result = await hasApiKey({ userId: 'u1', keyType: 'flash_free', serviceClient: client })
    expect(result).toBe(true)
  })

  it('hasApiKey retorna false cuando no existe', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => userApiBuilder)

    const result = await hasApiKey({ userId: 'u1', keyType: 'flash_free', serviceClient: client })
    expect(result).toBe(false)
  })

  it('resolveApiKey usa flash_free cuando model=flash y use_paid_key_for_all=false', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient

    const settingsBuilder = client.__mock.createBuilder()
    settingsBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ use_paid_key_for_all: false }))

    const keysBuilder = client.__mock.createBuilder()
    keysBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ vault_secret_id: 's1' }))

    client.__mock.from.mockImplementation((table: string) => {
      if (table === 'user_settings') return settingsBuilder
      if (table === 'user_api_keys') return keysBuilder
      return client.__mock.createBuilder()
    })

    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseSuccess('flash-key'))

    const result = await resolveApiKey({ userId: 'u1', model: 'flash', serviceClient: client })
    expect(result).toEqual({ apiKey: 'flash-key', keyType: 'flash_free' })
  })

  it('resolveApiKey usa pro_paid cuando model=pro y use_paid_key_for_all=false', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const settingsBuilder = client.__mock.createBuilder()
    settingsBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ use_paid_key_for_all: false }))
    const keysBuilder = client.__mock.createBuilder()
    keysBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ vault_secret_id: 's2' }))
    client.__mock.from.mockImplementation((table: string) => (table === 'user_settings' ? settingsBuilder : keysBuilder))
    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseSuccess('pro-key'))

    const result = await resolveApiKey({ userId: 'u1', model: 'pro', serviceClient: client })
    expect(result).toEqual({ apiKey: 'pro-key', keyType: 'pro_paid' })
  })

  it('resolveApiKey usa pro_paid cuando use_paid_key_for_all=true y model=flash', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const settingsBuilder = client.__mock.createBuilder()
    settingsBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ use_paid_key_for_all: true }))
    const keysBuilder = client.__mock.createBuilder()
    keysBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ vault_secret_id: 's3' }))
    client.__mock.from.mockImplementation((table: string) => (table === 'user_settings' ? settingsBuilder : keysBuilder))
    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseSuccess('pro-key'))

    const result = await resolveApiKey({ userId: 'u1', model: 'flash', serviceClient: client })
    expect(result).toEqual({ apiKey: 'pro-key', keyType: 'pro_paid' })
  })

  it('resolveApiKey retorna null cuando no hay key disponible', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const settingsBuilder = client.__mock.createBuilder()
    settingsBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ use_paid_key_for_all: false }))
    const keysBuilder = client.__mock.createBuilder()
    keysBuilder.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation((table: string) => (table === 'user_settings' ? settingsBuilder : keysBuilder))

    const result = await resolveApiKey({ userId: 'u1', model: 'flash', serviceClient: client })
    expect(result).toBeNull()
  })

  it('deleteApiKey elimina key en vault y referencia', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient

    const userApiBuilder = client.__mock.createBuilder()
    userApiBuilder.maybeSingle.mockResolvedValueOnce(
      mockSupabaseSuccess({ id: 'k1', vault_secret_id: 's1' }),
    )
    userApiBuilder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    client.__mock.from.mockImplementation(() => userApiBuilder)
    client.__mock.rpc.mockResolvedValueOnce(mockSupabaseSuccess(true))

    const result = await deleteApiKey({ userId: 'u1', keyType: 'flash_free', serviceClient: client })
    expect(result.success).toBe(true)
  })
})
