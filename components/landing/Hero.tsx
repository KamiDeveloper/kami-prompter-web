import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="w-full py-24 md:py-32 lg:py-48 flex justify-center text-center">
      <div className="container px-4 md:px-6 flex flex-col items-center gap-6 lg:max-w-5xl">
        <div className="inline-flex items-center rounded-full border border-accent-border bg-accent-subtle px-3 py-1 text-sm text-accent-light">
          <span className="flex h-2 w-2 rounded-full bg-accent mr-2" />
          Kami Prompter v0.1.0 ya disponible
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-balance text-text-primary">
          Eleva tus Prompts al <span className="text-accent">Siguiente Nivel</span>
        </h1>
        <p className="mx-auto max-w-175 text-text-secondary md:text-xl text-balance">
          La plataforma definitiva para crear, mejorar y gestionar prompts profesionales. Impulsado por Gemini Flash y Pro.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-base">
              Comenzar Gratis
              <span className="ml-2 text-sm">-&gt;</span>
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
