'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { Tables } from '@/types'

type HistoryEntry = Tables<'prompt_history'>

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [entry, setEntry] = React.useState<HistoryEntry | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [deleting, setDeleting] = React.useState(false)

  const entryId = React.useMemo(() => {
    const raw = params?.id
    return typeof raw === 'string' ? raw : ''
  }, [params])

  React.useEffect(() => {
    const loadEntry = async () => {
      if (!entryId) return

      setLoading(true)
      try {
        const res = await fetch(`/api/history/${entryId}`)

        if (res.status === 404) {
          router.replace('/app/history')
          return
        }

        if (!res.ok) {
          throw new Error('No fue posible cargar el detalle del historial.')
        }

        const payload = (await res.json()) as { data: HistoryEntry }
        setEntry(payload.data)
      } catch (error: unknown) {
        toast(error instanceof Error ? error.message : 'Error al cargar historial.', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadEntry()
  }, [entryId, router, toast])

  const handleDelete = async () => {
    if (!entry) return

    const confirmed = window.confirm('¿Seguro que deseas eliminar esta entrada del historial?')
    if (!confirmed) return

    setDeleting(true)

    try {
      const res = await fetch(`/api/history/${entry.id}`, { method: 'DELETE' })

      if (!res.ok) {
        throw new Error('No fue posible eliminar la entrada.')
      }

      toast('Entrada eliminada correctamente.', 'success')
      router.replace('/app/history')
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Error al eliminar.', 'error')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <p className="text-text-secondary">No se encontró la entrada del historial.</p>
        <Link href="/app/history" className="text-accent hover:underline">
          Volver al historial
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between gap-3">
        <Link href="/app/history">
          <Button variant="outline" size="sm">
            <ArrowLeft size={14} className="mr-1.5" />
            Volver
          </Button>
        </Link>

        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Trash2 size={14} className="mr-1.5" />}
          Eliminar
        </Button>
      </div>

      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Detalle de historial</h1>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="outline">{entry.module}</Badge>
          <span className="text-xs text-text-secondary">
            {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Fecha desconocida'}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt de entrada</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap wrap-break-word text-sm text-text-primary">{entry.input_prompt}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt de salida</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap wrap-break-word text-sm text-text-primary">
            {entry.output_prompt ?? 'Sin salida registrada.'}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-secondary">Modelo</p>
              <p className="font-medium text-text-primary">{entry.model_used}</p>
            </div>
            <div>
              <p className="text-text-secondary">Thinking level</p>
              <p className="font-medium text-text-primary">{entry.thinking_level}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
