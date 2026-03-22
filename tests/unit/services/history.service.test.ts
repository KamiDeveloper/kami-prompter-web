import { beforeEach, describe, expect, it } from 'vitest'

import { clearUserHistory, deleteHistoryEntry, getUserHistory, saveToHistory } from '@/lib/services/history.service'
import { createMockSupabaseClient, mockSupabaseError, mockSupabaseSuccess, type MockSupabaseClient } from '@/tests/unit/helpers/supabase-mock'

describe('history.service', () => {
  beforeEach(() => {
    // no-op
  })

  it('saveToHistory retorna registro insertado cuando es exitoso', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    const row = {
      id: 'h1',
      user_id: 'u1',
      module: 'improver' as const,
      input_prompt: 'input',
      model_used: 'flash',
      thinking_level: 'LOW',
    }
    builder.single.mockResolvedValueOnce(mockSupabaseSuccess(row))
    client.__mock.from.mockImplementation(() => builder)

    const result = await saveToHistory(client, row)
    expect(result.id).toBe('h1')
  })

  it('saveToHistory lanza error cuando el insert falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.single.mockResolvedValueOnce(mockSupabaseError('insert failed'))
    client.__mock.from.mockImplementation(() => builder)

    await expect(
      saveToHistory(client, {
        user_id: 'u1',
        module: 'improver'as const,
        input_prompt: 'x',
        model_used: 'flash',
        thinking_level: 'LOW',
      }),
    ).rejects.toThrow('Unable to save history entry')
  })

  it('saveToHistory inserta campos esenciales', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.single.mockResolvedValueOnce(mockSupabaseSuccess({ id: 'h1' }))
    client.__mock.from.mockImplementation(() => builder)

    await saveToHistory(client, {
      user_id: 'u1',
      module: 'builder' as const,
      input_prompt: 'prompt',
      model_used: 'pro',
      thinking_level: 'HIGH',
    })

    const inserted = builder.insert.mock.calls[0][0] as Record<string, unknown>
    expect(inserted.user_id).toBe('u1')
    expect(inserted.module).toBe('builder')
    expect(inserted.input_prompt).toBe('prompt')
    expect(inserted.model_used).toBe('pro')
  })

  it('getUserHistory retorna data y count', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce({ data: [{ id: 'h1' }], count: 1, error: null })
    client.__mock.from.mockImplementation(() => builder)

    const result = await getUserHistory(client, 'u1')
    expect(result.count).toBe(1)
    expect(result.data).toHaveLength(1)
  })

  it('getUserHistory filtra por módulo cuando se pasa options.module', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce({ data: [], count: 0, error: null })
    client.__mock.from.mockImplementation(() => builder)

    await getUserHistory(client, 'u1', { module: 'prd' as const })
    expect(builder.eq).toHaveBeenCalledWith('module', 'prd')
  })

  it('getUserHistory aplica limit cuando se pasa options.limit', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce({ data: [], count: 0, error: null })
    client.__mock.from.mockImplementation(() => builder)

    await getUserHistory(client, 'u1', { limit: 10, offset: 5 })
    expect(builder.range).toHaveBeenCalledWith(5, 14)
  })

  it('getUserHistory retorna array vacío sin lanzar', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce({ data: [], count: 0, error: null })
    client.__mock.from.mockImplementation(() => builder)

    const result = await getUserHistory(client, 'u1')
    expect(result.data).toEqual([])
  })

  it('deleteHistoryEntry llama delete con el id correcto', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => builder)

    await deleteHistoryEntry(client, 'h1', 'u1')
    expect(builder.eq).toHaveBeenCalledWith('id', 'h1')
  })

  it('deleteHistoryEntry lanza cuando delete falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseError('delete failed'))
    client.__mock.from.mockImplementation(() => builder)

    await expect(deleteHistoryEntry(client, 'h1', 'u1')).rejects.toThrow('Unable to delete history entry')
  })

  it('clearUserHistory llama delete filtrando por user_id', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => builder)

    await clearUserHistory(client, 'u1')
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('clearUserHistory lanza cuando falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseError('clear failed'))
    client.__mock.from.mockImplementation(() => builder)

    await expect(clearUserHistory(client, 'u1')).rejects.toThrow('Unable to clear user history')
  })
})
