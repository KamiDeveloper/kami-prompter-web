import { beforeEach, describe, expect, it } from 'vitest'

import { getUserSettings, updateApiKeyValidity, updateUserSettings } from '@/lib/services/settings.service'
import { createMockSupabaseClient, mockSupabaseError, mockSupabaseSuccess, type MockSupabaseClient } from '@/tests/unit/helpers/supabase-mock'

describe('settings.service', () => {
  beforeEach(() => {
    // no-op
  })

  it('getUserSettings retorna settings cuando la query es exitosa', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.single.mockResolvedValueOnce(
      mockSupabaseSuccess({
        user_id: 'u1',
        default_model: 'flash',
        default_thinking_level: 'MEDIUM',
      }),
    )
    client.__mock.from.mockImplementation(() => builder)

    const result = await getUserSettings(client, 'u1')
    expect(result.user_id).toBe('u1')
    expect(result.default_model).toBe('flash')
  })

  it('getUserSettings lanza error cuando falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.single.mockResolvedValueOnce(mockSupabaseError('not found'))
    client.__mock.from.mockImplementation(() => builder)

    await expect(getUserSettings(client, 'u1')).rejects.toThrow('Unable to fetch user settings')
  })

  it('updateUserSettings llama update con los datos proporcionados', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.single.mockResolvedValueOnce(mockSupabaseSuccess({ user_id: 'u1', show_nsfw: true }))
    client.__mock.from.mockImplementation(() => builder)

    await updateUserSettings(client, 'u1', { show_nsfw: true })

    expect(builder.update).toHaveBeenCalledWith({ show_nsfw: true })
  })

  it('updateUserSettings retorna registro actualizado', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.single.mockResolvedValueOnce(mockSupabaseSuccess({ user_id: 'u1', theme: 'light' }))
    client.__mock.from.mockImplementation(() => builder)

    const result = await updateUserSettings(client, 'u1', { theme: 'light' })
    expect(result.theme).toBe('light')
  })

  it('updateApiKeyValidity actualiza is_valid y last_verified_at', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => builder)

    await expect(updateApiKeyValidity(client, 'u1', 'flash_free', true)).resolves.toBeUndefined()
    expect(builder.update).toHaveBeenCalledTimes(1)

    const payload = builder.update.mock.calls[0][0] as { is_valid: boolean; last_verified_at: string }
    expect(payload.is_valid).toBe(true)
    expect(typeof payload.last_verified_at).toBe('string')
    expect(new Date(payload.last_verified_at).toISOString()).toBe(payload.last_verified_at)
  })
})
