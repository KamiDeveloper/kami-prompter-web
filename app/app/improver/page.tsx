import type { Metadata } from 'next'
import { ImproverWorkspace } from '@/components/improver/improver-workspace'
import { ApiKeyBanner } from '@/components/shared/ApiKeyBanner'

export const metadata: Metadata = {
  title: 'Improver',
  description: 'Mejora prompts mediante ingeniería avanzada',
}

export default function ImproverPage() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <ApiKeyBanner />
      <ImproverWorkspace />
    </div>
  )
}
