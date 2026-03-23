import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useTemplate, useTemplates } from '@/hooks/use-templates'
import type { TemplateWithRelations } from '@/types'

import {
  createFetchMock,
  mockFetchFailure,
  mockJsonFetch,
  renderHookHarness,
  runHookAction,
  waitForCondition,
} from '@/tests/unit/hooks/hook-harness'

const mockTemplate: TemplateWithRelations = {
  id: 'template-id-123',
  name: 'Template de prueba',
  description: 'descripcion',
  is_nsfw: false,
  category_id: null,
  category: { id: 'cat-1', name: 'General', emoji: '📦' },
  tags: [{ tag: 'python', created_by: 'user' }],
  branches: [{ id: 'br-1', name: 'main', is_main: true, parent_branch_id: null, updated_at: '2026-03-22T00:00:00.000Z' }],
  main_branch_content: 'contenido',
  created_at: '2026-03-22T00:00:00.000Z',
  updated_at: '2026-03-22T00:00:00.000Z',
}

describe('useTemplates / useTemplate', () => {
  beforeEach(() => {
    createFetchMock()
  })

  afterEach(() => {
    createFetchMock()
  })

  it('useTemplates hace GET en mount', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { data: [mockTemplate] })

    const hook = await renderHookHarness(() => useTemplates())
    await waitForCondition(() => hook.current.loading === false)

    expect(fetchMock).toHaveBeenCalledWith('/api/templates?')
    expect(hook.current.templates).toHaveLength(1)

    await hook.unmount()
  })

  it('refetch incluye categoryId en query', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { data: [] })
    mockJsonFetch(fetchMock, { data: [] })

    const hook = await renderHookHarness(() => useTemplates())
    await waitForCondition(() => hook.current.loading === false)

    await runHookAction(() => hook.current.refetch({ categoryId: 'cat-123' }))

    const secondCall = fetchMock.mock.calls[1][0] as string
    expect(secondCall).toContain('categoryId=cat-123')

    await hook.unmount()
  })

  it('useTemplate hace GET a /api/templates/:id', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { data: mockTemplate })

    const hook = await renderHookHarness(() => useTemplate('template-id-123'))
    await waitForCondition(() => hook.current.loading === false)

    const firstCall = fetchMock.mock.calls[0][0] as string
    expect(firstCall).toBe('/api/templates/template-id-123')
    expect(hook.current.template?.id).toBe('template-id-123')

    await hook.unmount()
  })

  it('captura error de red y setea estado sin lanzar', async () => {
    const fetchMock = createFetchMock()
    mockFetchFailure(fetchMock, 'Network error')

    const hook = await renderHookHarness(() => useTemplates())
    await waitForCondition(() => hook.current.loading === false)

    expect(hook.current.error).toBe('Network error')
    expect(hook.current.templates).toEqual([])

    await hook.unmount()
  })
})
