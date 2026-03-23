'use client'
import * as React from 'react'
import { useHistory } from '@/hooks/use-history'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HistoryPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { history, loading, hasMore, fetchHistory } = useHistory()

  // Efecto para cargar el historial inicialmente
  React.useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="border-b border-border pb-6 mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Historial</h1>
        <p className="text-text-secondary mt-1">Tus generaciones y mejoras recientes.</p>
      </div>

      <div className="flex flex-col gap-4">
        {history.map((item) => (
          <Link href={`/app/history/${item.id}`} key={item.id} className="block group">
            <Card hoverable padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border bg-surface">
               <div className="flex-1 overflow-hidden">
                 <div className="flex items-center gap-3 mb-1.5">
                   {/* Corregido: item.modulo a item.module */}
                   <Badge variant="outline" className="bg-(--color-bg)">{item.module}</Badge>
                   {/* Corregido: Manejo de posible null en created_at */}
                   <span className="text-xs text-text-secondary">
                     {item.created_at ? new Date(item.created_at).toLocaleString() : 'Fecha desconocida'}
                   </span>
                 </div>
                 {/* Corregido: Propiedades incorrectas cambiadas a input_prompt y output_prompt */}
                 <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors truncate w-full">
                   {item.input_prompt || item.output_prompt || 'Generación sin título'}
                 </h3>
               </div>
               <ArrowRight className="text-text-secondary group-hover:text-accent transition-all sm:-translate-x-2 group-hover:translate-x-0" size={20} />
            </Card>
          </Link>
        ))}

        {loading && (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-accent" size={24} />
          </div>
        )}

        {!loading && hasMore && history.length > 0 && (
          <button 
            onClick={() => fetchHistory(true)}
            className="text-sm text-accent font-medium hover:underline text-center py-4"
          >
            Cargar más
          </button>
        )}

        {!loading && history.length === 0 && (
          <div className="text-center p-16 border border-dashed border-border rounded-xl text-text-secondary bg-surface-raised/50">
            No hay elementos en tu historial.
          </div>
        )}
      </div>
    </div>
  )
}