import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white lg:flex border-r border-zinc-800">
        <div className="absolute inset-0 bg-zinc-900" />
        <Link href="/" className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <Image src="/logo.svg" alt="Kami Prompter" width={22} height={22} className="shrink-0" priority />
          Kami Prompter
        </Link>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg text-zinc-300">
              &quot;Kami Prompter transformó la manera en que estructuramos nuestros requerimientos, ahorrando horas en cada iteración de producto.&quot;
            </p>
            <footer className="text-sm font-semibold text-zinc-100">Senior Product Manager</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 flex items-center justify-center p-8 h-full bg-(--color-bg)">
        {children}
      </div>
    </div>
  )
}
