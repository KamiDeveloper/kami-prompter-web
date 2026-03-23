import { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Kami Prompter',
  description: 'Inicia sesión en tu cuenta de Kami Prompter.',
}

export default function LoginPage() {
  return <AuthForm view="login" />
}
