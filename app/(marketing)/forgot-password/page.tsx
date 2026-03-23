'use client'
import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setLoading(false)
    if (error) {
      toast(error.message, 'error')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="flex w-full flex-col justify-center space-y-6 sm:w-95">
      <Link href="/login" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={14} /> Volver al inicio de sesión
      </Link>

      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-accent-subtle flex items-center justify-center text-accent">
            <Mail size={28} />
          </div>
          <h2 className="text-xl font-semibold">Revisa tu correo</h2>
          <p className="text-sm text-text-secondary max-w-xs">
            Si existe una cuenta con <span className="text-text-primary font-medium">{email}</span>, recibirás un enlace para restablecer tu contraseña.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">¿Olvidaste tu contraseña?</h1>
            <p className="text-sm text-text-secondary">Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !email} className="w-full">
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              Enviar enlace de recuperación
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
