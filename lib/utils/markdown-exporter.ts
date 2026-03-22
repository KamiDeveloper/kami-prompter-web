function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Genera contenido markdown exportable con metadatos opcionales.
 * @param content Cuerpo principal del documento.
 * @param metadata Metadatos opcionales para cabecera.
 * @returns Markdown final listo para descarga en cliente.
 */
export function generateMarkdownContent(
  content: string,
  metadata?: {
    title?: string
    module?: string
    createdAt?: Date
  },
): string {
  const lines: string[] = []

  if (metadata?.title) {
    lines.push(`# ${metadata.title}`)
    lines.push('')
  }

  if (metadata?.module || metadata?.createdAt) {
    lines.push('---')
    if (metadata.module) {
      lines.push(`module: ${metadata.module}`)
    }
    if (metadata.createdAt) {
      lines.push(`created_at: ${metadata.createdAt.toISOString()}`)
    }
    lines.push('---')
    lines.push('')
  }

  lines.push(content.trim())
  lines.push('')

  return lines.join('\n')
}

/**
 * Construye nombre de archivo de exportacion con timestamp.
 * @param type Tipo de artefacto exportado.
 * @param date Fecha base para nombre; por defecto fecha actual.
 * @returns Nombre de archivo markdown.
 */
export function generateFilename(type: 'prd' | 'prompt' | 'template', date = new Date()): string {
  return `kami-prompter-${type}-${formatDate(date)}.md`
}
