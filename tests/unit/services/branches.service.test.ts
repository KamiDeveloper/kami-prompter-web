import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createBranch,
  deleteBranch,
  getBranchesForTemplate,
  getDiffBetweenBranches,
  mergeBranchToMain,
  updateBranchContent,
} from '@/lib/services/branches.service'
import { createMockSupabaseClient, mockSupabaseError, mockSupabaseSuccess, type MockSupabaseClient, type MockQueryBuilder } from '@/tests/unit/helpers/supabase-mock'

function setupTableBuilders() {
  const client = createMockSupabaseClient() as MockSupabaseClient
  const buildersByTable: Record<string, MockQueryBuilder> = {
    prompt_templates: client.__mock.createBuilder(),
    template_branches: client.__mock.createBuilder(),
    branch_history: client.__mock.createBuilder(),
  }
  client.__mock.from.mockImplementation((table: string) => {
    return buildersByTable[table] ?? client.__mock.createBuilder()
  })
  return { client, buildersByTable }
}

describe('branches.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getBranchesForTemplate verifica ownership y retorna BranchSummary[]', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ id: 't1' }))
    buildersByTable.template_branches.execute.mockResolvedValueOnce(
      mockSupabaseSuccess([{ id: 'b1', name: 'main', is_main: true, parent_branch_id: null, updated_at: '2026-01-01T00:00:00.000Z' }]),
    )

    const result = await getBranchesForTemplate(client, 't1', 'u1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b1')
  })

  it('getBranchesForTemplate lanza Template not found si no hay ownership', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.maybeSingle.mockResolvedValueOnce(mockSupabaseError('not found'))

    await expect(getBranchesForTemplate(client, 't1', 'u1')).rejects.toThrow('Template not found')
  })

  it('createBranch verifica ownership, inserta is_main false y retorna rama creada', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ id: 't1' }))
    buildersByTable.template_branches.single.mockResolvedValueOnce(
      mockSupabaseSuccess({ id: 'b2', template_id: 't1', name: 'feat', is_main: false, content: 'new' }),
    )

    const result = await createBranch(client, 'u1', {
      templateId: 't1',
      branchName: 'feat',
      sourceContent: 'new',
    })

    expect(result.id).toBe('b2')
    expect(buildersByTable.template_branches.insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_main: false }),
    )
  })

  it('updateBranchContent actualiza branch e inserta snapshot en branch_history', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.template_branches.single
      .mockResolvedValueOnce(mockSupabaseSuccess({ id: 'b1', is_main: false, content: 'old' }))
      .mockResolvedValueOnce(mockSupabaseSuccess({ id: 'b1', is_main: false, content: 'new' }))
    buildersByTable.branch_history.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    const result = await updateBranchContent(client, 'b1', 'u1', 'new', 'change')
    expect(result.content).toBe('new')
    expect(buildersByTable.branch_history.insert).toHaveBeenCalledWith(
      expect.objectContaining({ change_description: 'change' }),
    )
  })

  it('updateBranchContent usa change_description null cuando no se pasa', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.template_branches.single
      .mockResolvedValueOnce(mockSupabaseSuccess({ id: 'b1', is_main: false, content: 'old' }))
      .mockResolvedValueOnce(mockSupabaseSuccess({ id: 'b1', is_main: false, content: 'new' }))
    buildersByTable.branch_history.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    await updateBranchContent(client, 'b1', 'u1', 'new')

    const payload = buildersByTable.branch_history.insert.mock.calls[0][0] as { change_description: string | null }
    expect(payload.change_description).toBeNull()
  })

  it('mergeBranchToMain ejecuta demote de target y promote de source', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ id: 't1' }))
    buildersByTable.template_branches.single.mockResolvedValueOnce(mockSupabaseSuccess({ id: 'source', template_id: 't1' }))
    buildersByTable.template_branches.execute
      .mockResolvedValueOnce(mockSupabaseSuccess(null))
      .mockResolvedValueOnce(mockSupabaseSuccess(null))

    await mergeBranchToMain(client, 'u1', {
      templateId: 't1',
      sourceBranchId: 'source',
      targetBranchId: 'target',
    })

    expect(buildersByTable.template_branches.update).toHaveBeenNthCalledWith(1, { is_main: false })
    expect(buildersByTable.template_branches.update).toHaveBeenNthCalledWith(2, { is_main: true })
  })

  it('mergeBranchToMain no ejecuta promote cuando falla el demote', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.prompt_templates.maybeSingle.mockResolvedValueOnce(mockSupabaseSuccess({ id: 't1' }))
    buildersByTable.template_branches.single.mockResolvedValueOnce(mockSupabaseSuccess({ id: 'source', template_id: 't1' }))
    buildersByTable.template_branches.execute.mockResolvedValueOnce(mockSupabaseError('demote fail'))

    await expect(
      mergeBranchToMain(client, 'u1', {
        templateId: 't1',
        sourceBranchId: 'source',
        targetBranchId: 'target',
      }),
    ).rejects.toThrow('Unable to demote current main branch')

    expect(buildersByTable.template_branches.update).toHaveBeenCalledTimes(1)
  })

  it('deleteBranch lanza error cuando la rama es main', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.template_branches.single.mockResolvedValueOnce(
      mockSupabaseSuccess({ id: 'b1', is_main: true }),
    )

    await expect(deleteBranch(client, 'b1', 'u1')).rejects.toThrow('Cannot delete main branch')
  })

  it('deleteBranch elimina cuando la rama no es main', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.template_branches.single.mockResolvedValueOnce(
      mockSupabaseSuccess({ id: 'b1', is_main: false }),
    )
    buildersByTable.template_branches.execute.mockResolvedValueOnce(mockSupabaseSuccess(null))

    await deleteBranch(client, 'b1', 'u1')
    expect(buildersByTable.template_branches.delete).toHaveBeenCalledTimes(1)
  })

  it('getDiffBetweenBranches valida ownership de ambas ramas y retorna contenidos', async () => {
    const { client, buildersByTable } = setupTableBuilders()
    buildersByTable.template_branches.single
      .mockResolvedValueOnce(mockSupabaseSuccess({ id: 'a', content: 'A content' }))
      .mockResolvedValueOnce(mockSupabaseSuccess({ id: 'b', content: 'B content' }))

    const result = await getDiffBetweenBranches(client, 'a', 'b', 'u1')
    expect(result).toEqual({ contentA: 'A content', contentB: 'B content' })
  })
})
