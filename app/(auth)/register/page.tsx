import { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Registro - Kami Prompter',
  description: 'Crea una cuenta en Kami Prompter.',
}

export default function RegisterPage() {
  return <AuthForm view="register" />
}
