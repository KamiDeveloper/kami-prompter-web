import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border py-8 w-full">
      <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span>Kami Prompter &copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-text-secondary">
          <Link href="#" className="hover:text-text-primary transition-colors">Privacidad</Link>
          <Link href="#" className="hover:text-text-primary transition-colors">Términos</Link>
        </div>
      </div>
    </footer>
  )
}
