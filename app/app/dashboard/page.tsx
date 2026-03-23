'use client'
import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Wand2, Blocks, FileText, Library, History as HistoryIcon, Clock, FileStack } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useHistory } from '@/hooks/use-history'
import { useTemplates } from '@/hooks/use-templates'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

const tools = [
  { id: 'improver', label: 'Improver', icon: Wand2, desc: 'Optimiza prompts existentes con técnicas avanzadas.', href: '/app/improver', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'builder', label: 'Builder', icon: Blocks, desc: 'Crea prompts estructurados desde cero.', href: '/app/builder', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'prd', label: 'PRD Maker', icon: FileText, desc: 'Genera documentos de producto completos.', href: '/app/prd', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'templates', label: 'Library', icon: Library, desc: 'Gestiona tus mejores prompts guardados.', href: '/app/templates', color: 'text-orange-500', bg: 'bg-orange-500/10' },
]

export default function DashboardPage() {
  const { history, loading: historyLoading, fetchHistory } = useHistory({ limit: 5 })
  const { templates, loading: templatesLoading } = useTemplates({
    orderBy: 'created_at',
    orderDirection: 'desc',
  })

  React.useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const recentActivity = React.useMemo(() => {
    const historyItems = history.map((item) => ({
      id: item.id,
      title: item.input_prompt || item.output_prompt || 'Actividad sin nombre',
      date: item.created_at,
      badge: item.module,
      href: `/app/history/${item.id}`,
      type: 'history' as const,
    }))

    const templateItems = templates.map((template) => ({
      id: `template-${template.id}`,
      title: template.name,
      date: template.created_at,
      badge: 'template',
      href: `/app/templates/${template.id}`,
      type: 'template' as const,
    }))

    return [...historyItems, ...templateItems]
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .slice(0, 5)
  }, [history, templates])

  const loading = historyLoading || templatesLoading

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-text-secondary">Bienvenido a Kami Prompter. ¿Qué deseas crear hoy?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link key={tool.id} href={tool.href} className="flex h-full">
              <Card hoverable className="h-full flex flex-col justify-between group flex-1 transition-all hover:bg-surface-raised">
                <CardHeader>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${tool.bg} ${tool.color}`}>
                    <Icon size={20} />
                  </div>
                  <CardTitle className="group-hover:text-accent transition-colors">{tool.label}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">{tool.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <HistoryIcon size={20} className="text-text-secondary" />
            Actividad Reciente
          </h2>
          <Link href="/app/history" className="text-sm text-text-secondary hover:text-text-primary hover:underline flex items-center gap-1">
            Ver todo <ArrowRight size={14} />
          </Link>
        </div>
        
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" circle />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <div className="p-8 text-center text-text-secondary flex flex-col items-center">
                <Clock className="mb-2 opacity-50" size={24} />
                <p>No hay actividad reciente.</p>
              </div>
            ) : (
              recentActivity.map((item) => (
                <Link key={item.id} href={item.href} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 hover:bg-surface-raised transition-colors relative z-10 w-full group">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <span className="font-medium truncate group-hover:text-accent transition-colors flex items-center gap-2">
                      {item.type === 'template' ? <FileStack size={14} className="text-text-secondary shrink-0" /> : null}
                      {item.title}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {item.type === 'template' ? 'Template creado' : 'Actividad de prompt'} · {new Date(item.date ?? Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="w-fit">{item.badge}</Badge>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
