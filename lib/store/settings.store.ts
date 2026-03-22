import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ModelKey, ThinkingLevelKey } from '@/types'

interface SettingsState {
  defaultModel: ModelKey
  defaultThinkingLevel: ThinkingLevelKey
  usePaidKeyForAll: boolean
  showNsfw: boolean
  theme: 'dark' | 'light' | 'system'
  defaultExportFormat: 'markdown' | 'txt'
  prdDefaultDetail: 'basic' | 'standard' | 'exhaustive'
  prdDefaultLanguage: 'auto' | 'es' | 'en' | 'pt'
  apiKeyStatus: {
    flash: 'configured' | 'not_configured' | 'invalid' | 'verifying'
    pro: 'configured' | 'not_configured' | 'invalid' | 'verifying'
  }
  setSettings: (settings: Partial<Omit<SettingsState, 'setSettings' | 'setApiKeyStatus' | 'apiKeyStatus'>>) => void
  setApiKeyStatus: (type: 'flash' | 'pro', status: SettingsState['apiKeyStatus']['flash']) => void
}

/**
 * Store global de settings con persistencia parcial en localStorage.
 * @param none No requiere parametros.
 * @returns Hook Zustand para leer y mutar settings.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultModel: 'flash',
      defaultThinkingLevel: 'MEDIUM',
      usePaidKeyForAll: false,
      showNsfw: false,
      theme: 'dark',
      defaultExportFormat: 'markdown',
      prdDefaultDetail: 'standard',
      prdDefaultLanguage: 'auto',
      apiKeyStatus: {
        flash: 'not_configured',
        pro: 'not_configured',
      },
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
      setApiKeyStatus: (type, status) =>
        set((state) => ({
          apiKeyStatus: {
            ...state.apiKeyStatus,
            [type]: status,
          },
        })),
    }),
    {
      name: 'kami-prompter-settings',
      partialize: (state) => ({
        defaultModel: state.defaultModel,
        defaultThinkingLevel: state.defaultThinkingLevel,
        usePaidKeyForAll: state.usePaidKeyForAll,
        showNsfw: state.showNsfw,
        theme: state.theme,
        defaultExportFormat: state.defaultExportFormat,
        prdDefaultDetail: state.prdDefaultDetail,
        prdDefaultLanguage: state.prdDefaultLanguage,
      }),
    },
  ),
)

export type { SettingsState }
