import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createCategory,
  deleteCategory,
  getCategoriesForUser,
  reorderCategories,
  updateCategory,
} from '@/lib/services/categories.service'
import { createMockSupabaseClient, mockSupabaseError, mockSupabaseSuccess, type MockSupabaseClient } from '@/tests/unit/helpers/supabase-mock'

describe('categories.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCategoriesForUser retorna categorías cuando la query es exitosa', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess([{ id: 'c1', name: 'Code' }]))
    client.__mock.from.mockImplementation(() => builder)

    const result = await getCategoriesForUser(client, 'u1')
    expect(result).toHaveLength(1)
  })

  it('getCategoriesForUser retorna [] cuando no hay categorías', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess([]))
    client.__mock.from.mockImplementation(() => builder)

    const result = await getCategoriesForUser(client, 'u1')
    expect(result).toEqual([])
  })

  it('createCategory inserta con user_id correcto y emoji default', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.single.mockResolvedValueOnce(mockSupabaseSuccess({ id: 'c1', user_id: 'u1', emoji: '📁' }))
    client.__mock.from.mockImplementation(() => builder)

    await createCategory(client, 'u1', { name: 'Nueva' })
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1', emoji: '📁' }))
  })

  it('updateCategory llama update filtrando por id y user_id', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.single.mockResolvedValueOnce(mockSupabaseSuccess({ id: 'c1', name: 'Editada' }))
    client.__mock.from.mockImplementation(() => builder)

    await updateCategory(client, 'c1', 'u1', { name: 'Editada' })
    expect(builder.eq).toHaveBeenCalledWith('id', 'c1')
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('deleteCategory llama delete filtrando por id y user_id', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => builder)

    await deleteCategory(client, 'c1', 'u1')
    expect(builder.delete).toHaveBeenCalledTimes(1)
    expect(builder.eq).toHaveBeenCalledWith('id', 'c1')
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('deleteCategory lanza cuando falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseError('delete fail'))
    client.__mock.from.mockImplementation(() => builder)

    await expect(deleteCategory(client, 'c1', 'u1')).rejects.toThrow('Unable to delete category')
  })

  it('reorderCategories con 3 ids hace 3 updates de sort_order', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute
      .mockResolvedValueOnce(mockSupabaseSuccess(null))
      .mockResolvedValueOnce(mockSupabaseSuccess(null))
      .mockResolvedValueOnce(mockSupabaseSuccess(null))
    client.__mock.from.mockImplementation(() => builder)

    await reorderCategories(client, 'u1', ['a', 'b', 'c'])

    expect(builder.update).toHaveBeenNthCalledWith(1, { sort_order: 0 })
    expect(builder.update).toHaveBeenNthCalledWith(2, { sort_order: 1 })
    expect(builder.update).toHaveBeenNthCalledWith(3, { sort_order: 2 })
  })

  it('reorderCategories lanza si algún update falla', async () => {
    const client = createMockSupabaseClient() as MockSupabaseClient
    const builder = client.__mock.createBuilder()
    builder.execute.mockResolvedValueOnce(mockSupabaseError('fail on first'))
    client.__mock.from.mockImplementation(() => builder)

    await expect(reorderCategories(client, 'u1', ['a', 'b'])).rejects.toThrow('Unable to reorder categories')
  })
})
