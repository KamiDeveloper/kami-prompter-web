'use client'
import { useState, useCallback, useEffect } from 'react'
import type { Tables } from '@/types'

type Category = Tables<'template_categories'>

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const { data } = await res.json() as { data: Category[] }
      setCategories(data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const createCategory = async (name: string, emoji?: string): Promise<Category> => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji }),
    })
    if (!res.ok) throw new Error('Failed to create category')
    const { data } = await res.json() as { data: Category }
    setCategories(prev => [...prev, data])
    return data
  }

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, loading, error, refetch: fetchCategories, createCategory }
}
