import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addTagsToTemplate, removeTagFromTemplate, replaceAllTags } from '@/lib/services/tags.service'
import { createMockSupabaseClient, mockSupabaseSuccess, type MockSupabaseClient } from '@/tests/unit/helpers/supabase-mock'

describe('tags.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('addTagsToTemplate inserta tags con template_id y created_by correctos', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()

    builder.execute
      .mockResolvedValueOnce(mockSupabaseSuccess(null))
      .mockResolvedValueOnce(
        mockSupabaseSuccess([
          { id: '1', template_id: 't1', tag: 'qa', created_by: 'ai' },
          { id: '2', template_id: 't1', tag: 'prompt', created_by: 'ai' },
        ]),
      )

    client.__mock.from.mockImplementation(() => builder)

    const result = await addTagsToTemplate(client, 't1', ['qa', 'prompt'], 'ai')
    expect(result).toHaveLength(2)

    const rows = builder.upsert.mock.calls[0][0] as Array<{ template_id: string; created_by: string }>
    expect(rows[0].template_id).toBe('t1')
    expect(rows[0].created_by).toBe('ai')
  })

  it('addTagsToTemplate con array vacío no lanza y retorna el estado actual', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess([]))
    client.__mock.from.mockImplementation(() => builder)

    const result = await addTagsToTemplate(client, 't1', [], 'user')
    expect(result).toEqual([])
  })

  it('removeTagFromTemplate llama delete filtrando por template_id y tag', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => builder)

    await removeTagFromTemplate(client, 't1', 'obsolete')

    expect(builder.delete).toHaveBeenCalledTimes(1)
    expect(builder.eq).toHaveBeenCalledWith('template_id', 't1')
    expect(builder.eq).toHaveBeenCalledWith('tag', 'obsolete')
  })

  it('replaceAllTags primero borra y luego inserta nuevos tags', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute
      .mockResolvedValueOnce(mockSupabaseSuccess(null))
      .mockResolvedValueOnce(mockSupabaseSuccess(null))
      .mockResolvedValueOnce(mockSupabaseSuccess([{ id: '1', tag: 'new-tag' }]))
    client.__mock.from.mockImplementation(() => builder)

    const result = await replaceAllTags(client, 't1', [{ tag: 'new-tag', createdBy: 'user' }])
    expect(builder.delete).toHaveBeenCalledTimes(1)
    expect(builder.insert).toHaveBeenCalledTimes(1)
    expect(result).toHaveLength(1)
  })

  it('replaceAllTags con array vacío solo borra y no inserta', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => builder)

    const result = await replaceAllTags(client, 't1', [])
    expect(builder.delete).toHaveBeenCalledTimes(1)
    expect(builder.insert).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })
})
