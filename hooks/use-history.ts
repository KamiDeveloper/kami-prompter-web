'use client'
import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/lib/store/settings.store'
import type { Tables } from '@/types'

type HistoryEntry = Tables<'prompt_history'>

interface HistoryOptions {
  module?: 'improver' | 'builder' | 'prd'
  limit?: number
}

export function useHistory(options?: HistoryOptions) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchHistory = useCallback(async (isLoadMore = false) => {
    setLoading(true)
    setError(null)

    try {
      const offset = isLoadMore ? history.length : 0
      const query = new URLSearchParams({
        limit: String(options?.limit ?? 20),
        offset: String(offset),
      })
      if (options?.module) query.append('module', options.module)

      const res = await fetch(`/api/history?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch history')

      const { data, count } = await res.json() as { data: HistoryEntry[]; count: number }

      setHistory(prev => isLoadMore ? [...prev, ...data] : data)
      setTotalCount(count)
      setHasMore((offset + data.length) < count)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [history.length, options?.limit, options?.module])

  const deleteEntry = async (id: string) => {
    const res = await fetch(`/api/history/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete history entry')
    setHistory(prev => prev.filter(h => h.id !== id))
    setTotalCount(prev => prev - 1)
  }

  return { history, loading, error, hasMore, totalCount, fetchHistory, deleteEntry }
}
