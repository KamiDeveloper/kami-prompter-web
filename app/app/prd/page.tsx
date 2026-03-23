import type { Metadata } from 'next'
import { PrdWorkspace } from '@/components/prd/prd-workspace'
import { ApiKeyBanner } from '@/components/shared/ApiKeyBanner'

export const metadata: Metadata = {
  title: 'PRD Maker',
  description: 'Genera documentos PRD profesionales',
}

export default function PrdPage() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <ApiKeyBanner />
      <PrdWorkspace />
    </div>
  )
}
