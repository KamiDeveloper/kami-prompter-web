'use client'
import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '@/lib/store/settings.store'
import { useApiKeys } from '@/hooks/use-api-keys'
import { useToast } from '@/hooks/use-toast'
import {
  Key, ShieldCheck, ShieldX, Trash2, CheckCircle, AlertTriangle,
  ExternalLink, Zap, Cpu, Loader2, AlertCircle
} from 'lucide-react'
import type { Metadata } from 'next'

type KeyStatus = 'configured' | 'not_configured' | 'invalid' | 'verifying'

function StatusBadge({ status }: { status: KeyStatus }) {
  const map: Record<KeyStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'default'; Icon: React.ElementType }> = {
    configured:     { label: 'Configurada',    variant: 'success', Icon: CheckCircle },
    not_configured: { label: 'No configurada', variant: 'warning', Icon: AlertTriangle },
    invalid:        { label: 'Inválida',        variant: 'error',   Icon: ShieldX },
    verifying:      { label: 'Verificando...', variant: 'default', Icon: Loader2 },
  }
  const { label, variant, Icon } = map[status]
  return (
    <Badge variant={variant} className="flex items-center gap-1 shrink-0">
      <Icon size={10} className={status === 'verifying' ? 'animate-spin' : ''} />
      {label}
    </Badge>
  )
}

export default function ApiKeysPage() {
  const apiKeyStatus = useSettingsStore(state => state.apiKeyStatus)
  const usePaidKeyForAll = useSettingsStore(state => state.usePaidKeyForAll)
  const setSettings = useSettingsStore(state => state.setSettings)
  const [flashKey, setFlashKey] = React.useState('')
  const [proKey, setProKey] = React.useState('')
  const [savingPaidToggle, setSavingPaidToggle] = React.useState(false)
  const { storeKey, verifyKey, deleteKey, loading } = useApiKeys()
  const { toast } = useToast()

  const handleStore = async (keyType: 'flash_free' | 'pro_paid', value: string, setter: (v: string) => void) => {
    if (!value.trim()) { toast('La clave API no puede estar vacía.', 'warning'); return }
    try {
      await storeKey(keyType, value.trim())
      setter('')
      toast('Clave API guardada y verificada.', 'success')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al guardar la clave.', 'error')
    }
  }

  const handleVerify = async (keyType: 'flash_free' | 'pro_paid') => {
    try {
      const isValid = await verifyKey(keyType)
      toast(isValid ? 'Clave válida y funcional.' : 'Clave inválida o revocada.', isValid ? 'success' : 'error')
    } catch { toast('Error al verificar la clave.', 'error') }
  }

  const handleDelete = async (keyType: 'flash_free' | 'pro_paid') => {
    try {
      await deleteKey(keyType)
      toast('Clave eliminada.', 'success')
    } catch { toast('Error al eliminar la clave.', 'error') }
  }

  const handlePaidToggle = async (checked: boolean) => {
    setSavingPaidToggle(true)
    setSettings({ usePaidKeyForAll: checked })
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_paid_key_for_all: checked }),
      })
    } catch { toast('Error al guardar preferencia.', 'error') }
    finally { setSavingPaidToggle(false) }
  }

  const keys = [
    {
      keyType: 'flash_free' as const,
      label: 'Gemini Flash (Gratis)',
      Icon: Zap,
      description: 'API Key de Google AI Studio. Usada para Improver y Builder.',
      statusKey: 'flash' as const,
      value: flashKey,
      setter: setFlashKey,
      isStoringKey: loading.storingFlash,
      isVerifyingKey: loading.verifyingFlash,
      isDeletingKey: loading.deletingFlash,
    },
    {
      keyType: 'pro_paid' as const,
      label: 'Gemini Pro (Pago)',
      Icon: Cpu,
      description: 'API Key de pago. Da acceso a razonamiento profundo y modelos premium.',
      statusKey: 'pro' as const,
      value: proKey,
      setter: setProKey,
      isStoringKey: loading.storingPro,
      isVerifyingKey: loading.verifyingPro,
      isDeletingKey: loading.deletingPro,
    },
  ]

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl pb-10">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-text-secondary mt-1">
          Tus claves se cifran con Supabase Vault y nunca se exponen al cliente.
        </p>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2"
        >
          <ExternalLink size={12} /> Obtener una API Key gratuita en Google AI Studio
        </a>
      </div>

      <div className="grid gap-6">
        {keys.map(k => {
          const status = apiKeyStatus[k.statusKey]
          const anyLoading = k.isStoringKey || k.isVerifyingKey || k.isDeletingKey

          return (
            <Card key={k.keyType}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <k.Icon size={18} className="text-accent" />
                    <CardTitle className="text-base">{k.label}</CardTitle>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <CardDescription>{k.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="password"
                  placeholder={status === 'configured' ? '•••••••••••••••• (clave guardada)' : 'Pega tu API Key aquí'}
                  value={k.value}
                  onChange={e => k.setter(e.target.value)}
                  disabled={anyLoading}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleStore(k.keyType, k.value, k.setter)} disabled={!k.value.trim() || anyLoading} size="sm">
                    {k.isStoringKey ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <ShieldCheck size={14} className="mr-1.5" />}
                    Guardar y verificar
                  </Button>
                  {status !== 'not_configured' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleVerify(k.keyType)} disabled={anyLoading}>
                        {k.isVerifyingKey ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <ShieldCheck size={14} className="mr-1.5" />}
                        Re-verificar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(k.keyType)} disabled={anyLoading}>
                        {k.isDeletingKey ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Trash2 size={14} className="mr-1.5" />}
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Advanced toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración avanzada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Usar Paid Key para ambos modelos</p>
                <p className="text-xs text-text-secondary mt-0.5">Fuerza el uso de la API Key de pago incluso para operaciones que usan Flash.</p>
              </div>
              <Switch checked={usePaidKeyForAll ?? false} onChange={handlePaidToggle} disabled={savingPaidToggle} label="Usar Paid Key para ambos modelos" />
            </div>
            {usePaidKeyForAll && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning-subtle px-4 py-3">
                <AlertCircle size={15} className="text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-text-primary">
                  Activado: todas las operaciones usarán tu API Key de pago. Esto puede generar costos adicionales dependiendo de tu plan en Google AI Studio.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
