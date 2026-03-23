import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración',
  description: 'Gestiona tus preferencias y claves API.',
}

const settingsSections = [
  {
    href: '/app/settings/api-keys',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5" aria-hidden="true">
        <circle cx="7.5" cy="15.5" r="3.5" />
        <path d="M10.6 13.4l7.9-7.9a2 2 0 0 1 2.8 2.8l-1.1 1.1h-2.2v2.2h-2.2v2.2h-2.2l-3.4 3.4" />
      </svg>
    ),
    title: 'API Keys',
    description: 'Gestiona tus claves de Gemini Flash y Pro.',
  },
  {
    href: '/app/settings/appearance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
      </svg>
    ),
    title: 'Apariencia',
    description: 'Tema visual y preferencias de contenido.',
  },
  {
    href: '/app/settings/ai',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5" aria-hidden="true">
        <path d="M9.5 6.5a3 3 0 0 1 5 2.2V9a2 2 0 1 1 2.8 1.8A2.8 2.8 0 0 1 18 16a3 3 0 0 1-5.5 1.6A3 3 0 0 1 7 16a2.8 2.8 0 0 1 .7-5.2A2 2 0 1 1 10.5 9v-.3a3 3 0 0 1-1-2.2Z" />
      </svg>
    ),
    title: 'Preferencias de IA',
    description: 'Modelo, thinking level y configuración de PRD.',
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-text-secondary mt-1">Gestiona tus preferencias y claves API.</p>
      </div>
      <nav className="flex flex-col gap-2" aria-label="Secciones de configuración">
        {settingsSections.map((section) => {
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-surface-raised hover:border-border-strong transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center text-accent shrink-0">
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{section.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{section.description}</p>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors shrink-0"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
