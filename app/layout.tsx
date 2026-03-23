import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Kami Prompter', template: '%s — Kami Prompter' },
  description: 'De un prompt mediocre a uno magistral — en segundos.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Kami Prompter' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09090e' },
    { media: '(prefers-color-scheme: light)', color: '#f5f5fa' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
