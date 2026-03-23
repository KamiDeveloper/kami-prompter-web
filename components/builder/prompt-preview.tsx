import * as React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle2 } from 'lucide-react'

export function PromptPreview({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 shrink-0 px-6 pt-6">
        <CardTitle className="text-lg">Prompt Generado</CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <CheckCircle2 size={16} className="mr-2 text-(--color-success)" /> : <Copy size={16} className="mr-2" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </CardHeader>
      <div className="flex-1 overflow-auto p-6 bg-(--color-bg) rounded-b-xl">
        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-primary">
          {content}
        </div>
      </div>
    </Card>
  )
}
