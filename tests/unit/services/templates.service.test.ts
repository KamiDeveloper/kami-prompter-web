import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createTemplate,
  getTemplateById,
  getTemplates,
  permanentDeleteTemplate,
  restoreTemplate,
  searchTemplates,
  softDeleteTemplate,
} from '@/lib/services/templates.service'
import { createMockSupabaseClient, mockSupabaseError, mockSupabaseSuccess, type MockSupabaseClient, type MockQueryBuilder } from '@/tests/unit/helpers/supabase-mock'

function setupTableBuilders() {
  const client = createMockSupabaseClient() as MockSupabaseClient

  const buildersByTable: Record<string, MockQueryBuilder> = {
    prompt_templates: client.__mock.createBuilder(),
    template_branches: client.__mock.createBuilder(),
    template_tags: client.__mock.createBuilder(),
    template_categories: client.__mock.createBuilder(),
  }
  client.__mock.from.mockImplementation((table: string) => {
    return buildersByTable[table] ?? client.__mock.createBuilder()
  })

  return { client, buildersByTable }
}

describe('templates.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createTemplate retorna template y mainBranch cuando ambos inserts son exitosos', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.single.mockResolvedValueOnce(
      mockSupabaseSuccess({ id: 't1', user_id: 'u1', name: 'Plantilla' }),
    )
    buildersByTable.template_branches.single.mockResolvedValueOnce(
      mockSupabaseSuccess({ id: 'b1', template_id: 't1', name: 'main', is_main: true, content: 'x' }),
    )

    const result = await createTemplate(client, 'u1', {
      name: 'Plantilla',
      initialContent: 'x',
    })

    expect(result.template.id).toBe('t1')
    expect(result.mainBranch.id).toBe('b1')
    expect(result.mainBranch.name).toBe('main')
    expect(result.mainBranch.is_main).toBe(true)
  })

  it('createTemplate inserta tags cuando se pasan tags', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.single.mockResolvedValueOnce(mockSupabaseSuccess({ id: 't1' }))
    buildersByTable.template_branches.single.mockResolvedValueOnce(mockSupabaseSuccess({ id: 'b1', is_main: true, name: 'main' }))
    buildersByTable.template_tags.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    await createTemplate(client, 'u1', {
      name: 'Plantilla',
      initialContent: 'x',
      tags: ['qa', 'prompt'],
    })

    expect(buildersByTable.template_tags.insert).toHaveBeenCalledTimes(1)
  })

  it('createTemplate lanza error cuando falla la creación de main branch', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.single.mockResolvedValueOnce(mockSupabaseSuccess({ id: 't1' }))
    buildersByTable.template_branches.single.mockResolvedValueOnce(mockSupabaseError('branch fail'))

    await expect(
      createTemplate(client, 'u1', {
        name: 'Plantilla',
        initialContent: 'x',
      }),
    ).rejects.toThrow('Unable to create main branch')
  })

  it('getTemplateById retorna template hidratada con tags, branches y category', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.single.mockResolvedValueOnce(
      mockSupabaseSuccess({
        id: 't1',
        user_id: 'u1',
        category_id: 'c1',
        name: 'Plantilla',
        description: 'desc',
        is_nsfw: false,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      }),
    )
    buildersByTable.template_tags.execute.mockResolvedValueOnce(
      mockSupabaseSuccess([{ template_id: 't1', tag: 'qa', created_by: 'user' }]),
    )
    buildersByTable.template_branches.execute.mockResolvedValueOnce(
      mockSupabaseSuccess([{ id: 'b1', template_id: 't1', name: 'main', is_main: true, content: 'main content' }]),
    )
    buildersByTable.template_categories.execute.mockResolvedValueOnce(
      mockSupabaseSuccess([{ id: 'c1', name: 'Cat', emoji: '📁' }]),
    )

    const result = await getTemplateById(client, 't1', 'u1')
    expect(result.tags).toHaveLength(1)
    expect(result.branches).toHaveLength(1)
    expect(result.category?.id).toBe('c1')
  })

  it('getTemplateById lanza Template not found cuando no existe', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.single.mockResolvedValueOnce(mockSupabaseError('not found'))

    await expect(getTemplateById(client, 'missing', 'u1')).rejects.toThrow('Template not found')
  })

  it('softDeleteTemplate hace update con is_deleted y deleted_at ISO', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    await softDeleteTemplate(client, 't1', 'u1')
    const payload = buildersByTable.prompt_templates.update.mock.calls[0][0] as { is_deleted: boolean; deleted_at: string }
    expect(payload.is_deleted).toBe(true)
    expect(new Date(payload.deleted_at).toISOString()).toBe(payload.deleted_at)
    expect(buildersByTable.prompt_templates.eq).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('restoreTemplate hace update con is_deleted false y deleted_at null', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    await restoreTemplate(client, 't1', 'u1')
    expect(buildersByTable.prompt_templates.update).toHaveBeenCalledWith({ is_deleted: false, deleted_at: null })
  })

  it('permanentDeleteTemplate llama delete por id y user_id', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    await permanentDeleteTemplate(client, 't1', 'u1')
    expect(buildersByTable.prompt_templates.delete).toHaveBeenCalledTimes(1)
    expect(buildersByTable.prompt_templates.eq).toHaveBeenCalledWith('id', 't1')
    expect(buildersByTable.prompt_templates.eq).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('permanentDeleteTemplate lanza cuando falla delete', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.execute.mockResolvedValueOnce(mockSupabaseError('delete fail'))

    await expect(permanentDeleteTemplate(client, 't1', 'u1')).rejects.toThrow('Unable to permanently delete template')
  })

  it('searchTemplates delega en getTemplates y retorna vacío sin matches', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.execute.mockResolvedValueOnce({ data: [], error: null, count: 0 })

    const result = await searchTemplates(client, 'u1', 'sin-match', false)
    expect(result).toEqual([])
  })

  it('getTemplates aplica showNsfw false, filtra categoryId/tags y ordena por name asc', async () => {
    const { client, buildersByTable } = setupTableBuilders()

    buildersByTable.prompt_templates.execute.mockResolvedValueOnce(
      mockSupabaseSuccess([
        {
          id: 't2',
          user_id: 'u1',
          category_id: 'cat-1',
          name: 'Zeta',
          description: null,
          is_nsfw: false,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 't1',
          user_id: 'u1',
          category_id: 'cat-1',
          name: 'Alpha',
          description: null,
          is_nsfw: false,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ]),
    )
    buildersByTable.template_tags.execute.mockResolvedValueOnce(
      mockSupabaseSuccess([
        { template_id: 't1', tag: 'must', created_by: 'user' },
        { template_id: 't2', tag: 'other', created_by: 'user' },
      ]),
    )
    buildersByTable.template_branches.execute.mockResolvedValueOnce(
      mockSupabaseSuccess([
        { id: 'b1', template_id: 't1', name: 'main', is_main: true, content: 'a' },
        { id: 'b2', template_id: 't2', name: 'main', is_main: true, content: 'b' },
      ]),
    )
    buildersByTable.template_categories.execute.mockResolvedValueOnce(
      mockSupabaseSuccess([{ id: 'cat-1', name: 'Cat', emoji: '📁' }]),
    )

    const result = await getTemplates(client, 'u1', {
      showNsfw: false,
      categoryId: 'cat-1',
      tags: ['must'],
      orderBy: 'name',
      orderDirection: 'asc',
    })

    expect(buildersByTable.prompt_templates.eq).toHaveBeenCalledWith('is_nsfw', false)
    expect(buildersByTable.prompt_templates.eq).toHaveBeenCalledWith('category_id', 'cat-1')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alpha')
  })
})
