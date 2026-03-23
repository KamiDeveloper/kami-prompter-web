'use client'
import { useState } from 'react'
import { useSettingsStore } from '@/lib/store/settings.store'

type KeyType = 'flash_free' | 'pro_paid'
type KeyLabel = 'flash' | 'pro'

function keyTypeToLabel(keyType: KeyType): KeyLabel {
  return keyType === 'flash_free' ? 'flash' : 'pro'
}

export function useApiKeys() {
  const [storingFlash, setStoringFlash] = useState(false)
  const [storingPro, setStoringPro] = useState(false)
  const [verifyingFlash, setVerifyingFlash] = useState(false)
  const [verifyingPro, setVerifyingPro] = useState(false)
  const [deletingFlash, setDeletingFlash] = useState(false)
  const [deletingPro, setDeletingPro] = useState(false)
  const setApiKeyStatus = useSettingsStore(state => state.setApiKeyStatus)

  const storeKey = async (keyType: KeyType, apiKey: string): Promise<void> => {
    const label = keyTypeToLabel(keyType)
    if (keyType === 'flash_free') setStoringFlash(true)
    else setStoringPro(true)

    setApiKeyStatus(label, 'verifying')
    try {
      const res = await fetch('/api/keys/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyType, apiKey }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Unable to store API key')
      }
      setApiKeyStatus(label, 'configured')
    } catch (err) {
      setApiKeyStatus(label, 'not_configured')
      throw err
    } finally {
      if (keyType === 'flash_free') setStoringFlash(false)
      else setStoringPro(false)
    }
  }

  const verifyKey = async (keyType: KeyType): Promise<boolean> => {
    const label = keyTypeToLabel(keyType)
    if (keyType === 'flash_free') setVerifyingFlash(true)
    else setVerifyingPro(true)

    setApiKeyStatus(label, 'verifying')
    try {
      const res = await fetch('/api/keys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyType }),
      })
      if (!res.ok) {
        setApiKeyStatus(label, 'not_configured')
        return false
      }
      const { data } = await res.json() as { data: { isValid: boolean } }
      setApiKeyStatus(label, data.isValid ? 'configured' : 'invalid')
      return data.isValid
    } catch {
      setApiKeyStatus(label, 'not_configured')
      return false
    } finally {
      if (keyType === 'flash_free') setVerifyingFlash(false)
      else setVerifyingPro(false)
    }
  }

  const deleteKey = async (keyType: KeyType): Promise<void> => {
    const label = keyTypeToLabel(keyType)
    if (keyType === 'flash_free') setDeletingFlash(true)
    else setDeletingPro(true)

    try {
      const res = await fetch('/api/keys/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyType }),
      })
      if (!res.ok) throw new Error('Failed to delete key')
      setApiKeyStatus(label, 'not_configured')
    } finally {
      if (keyType === 'flash_free') setDeletingFlash(false)
      else setDeletingPro(false)
    }
  }

  return {
    storeKey,
    verifyKey,
    deleteKey,
    loading: {
      storingFlash,
      storingPro,
      verifyingFlash,
      verifyingPro,
      deletingFlash,
      deletingPro,
    },
  }
}
