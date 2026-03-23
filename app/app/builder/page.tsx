import type { Metadata } from 'next'
import { BuilderWorkspace } from '@/components/builder/builder-workspace'
import { ApiKeyBanner } from '@/components/shared/ApiKeyBanner'

export const metadata: Metadata = {
  title: 'Builder',
  description: 'Construye prompts estructurados desde cero',
}

export default function BuilderPage() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <ApiKeyBanner />
      <BuilderWorkspace />
    </div>
  )
}
