'use client'
import { useState, useCallback, useEffect } from 'react'
import type { TemplateWithRelations } from '@/types'

interface TemplateFiltersInput {
  categoryId?: string
  searchQuery?: string
  showNsfw?: boolean
  tags?: string[]
  orderBy?: 'created_at' | 'updated_at' | 'name'
  orderDirection?: 'asc' | 'desc'
}

export function useTemplates(initialFilters?: TemplateFiltersInput) {
  const [templates, setTemplates] = useState<TemplateWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async (filters?: TemplateFiltersInput) => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams()
      if (filters) {
        if (filters.categoryId) query.append('categoryId', filters.categoryId)
        if (filters.searchQuery) query.append('searchQuery', filters.searchQuery)
        if (filters.showNsfw) query.append('showNsfw', 'true')
        if (filters.tags?.length) query.append('tags', filters.tags.join(','))
        if (filters.orderBy) query.append('orderBy', filters.orderBy)
        if (filters.orderDirection) query.append('orderDirection', filters.orderDirection)
      }

      const res = await fetch(`/api/templates?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch templates')

      const { data } = await res.json() as { data: TemplateWithRelations[] }
      setTemplates(data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates(initialFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { templates, loading, error, refetch: fetchTemplates }
}

export function useTemplate(id: string) {
  const [template, setTemplate] = useState<TemplateWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplate = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/templates/${id}`)
      if (!res.ok) throw new Error('Failed to fetch template')
      const { data } = await res.json() as { data: TemplateWithRelations }
      setTemplate(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  return { template, loading, error, refetch: fetchTemplate }
}
