'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface AuthFormProps {
  view: 'login' | 'register'
}

export function AuthForm({ view }: AuthFormProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const supabase = createSupabaseBrowserClient()

    try {
      if (view === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })
        if (error) throw error
        toast('Registro exitoso. Revisa tu correo o inicia sesión para continuar.', 'success')
        router.push('/login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        router.push('/app/dashboard')
        toast('Check your email for the login link!', 'success')
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'An error occurred during authentication', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col justify-center space-y-6 sm:w-87.5">
      <div className="flex flex-col space-y-2 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-accent" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {view === 'login' ? 'Bienvenido de vuelta' : 'Crea una cuenta'}
        </h1>
        <p className="text-sm text-text-secondary">
          {view === 'login' 
            ? 'Ingresa tus credenciales para acceder a tu cuenta' 
            : 'Ingresa tus datos para empezar a crear mejores prompts'}
        </p>
      </div>

      <div className="grid gap-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            {view === 'register' && (
              <Input
                id="name"
                placeholder="Juan Pérez"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                disabled={loading}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                label="Nombre completo"
                required
              />
            )}
            <Input
              id="email"
              placeholder="nombre@ejemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={loading}
              value={email}
              onChange={e => setEmail(e.target.value)}
              label="Correo electrónico"
              required
            />
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              disabled={loading}
              value={password}
              onChange={e => setPassword(e.target.value)}
              label="Contraseña"
              required
            />
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {view === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
            </Button>
          </div>
        </form>
        
        <div className="text-center text-sm text-text-secondary">
          {view === 'login' ? (
            <p>
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="underline hover:text-text-primary transition-colors">
                Regístrate
              </Link>
            </p>
          ) : (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="underline hover:text-text-primary transition-colors">
                Inicia sesión
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
