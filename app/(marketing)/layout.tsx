import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-(--color-bg) text-text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-(--color-bg)/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-20 w-20 items-center justify-center">
              <Image src="/logo.svg" alt="Kami Prompter Logo" width={40} height={40} />
            </span>
            <span className="text-lg font-bold tracking-tight">Kami Prompter</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features" className="text-text-secondary hover:text-text-primary transition-colors">Características</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-accent transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/register">
              <Button size="sm">Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row md:px-6 lg:max-w-7xl">
          <p className="text-sm text-text-secondary">
            &copy; {new Date().getFullYear()} Kami Prompter. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-text-secondary hover:underline">Términos</Link>
            <Link href="#" className="text-sm text-text-secondary hover:underline">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
