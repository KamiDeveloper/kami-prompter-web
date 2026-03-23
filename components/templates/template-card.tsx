import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { GitBranch, Star } from 'lucide-react'
import type { TemplateWithRelations } from '@/types'

export function TemplateCard({ template }: { template: TemplateWithRelations }) {
  return (
    <Link href={`/app/templates/${template.id}`} className="block h-full">
      <Card hoverable className="h-full flex flex-col transition-all group bg-surface shadow-sm hover:shadow-md">
        <CardHeader className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="mb-2">
              {template.category?.emoji} {template.category?.name || 'General'}
            </Badge>
            {template.is_nsfw && <Badge variant="error" className="ml-2 bg-error-subtle">NSFW</Badge>}
          </div>
          <CardTitle className="text-lg group-hover:text-accent transition-colors line-clamp-1">
            {template.name}
          </CardTitle>
          <CardDescription className="line-clamp-2 mt-2">
            {template.description || 'Sin descripción provista.'}
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 pt-0 mt-auto flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <GitBranch size={14} />
            {template.branches?.length || 1} rama(s)
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Star size={14} />
            {new Date(template.updated_at).toLocaleDateString()}
          </div>
        </div>
      </Card>
    </Link>
  )
}
