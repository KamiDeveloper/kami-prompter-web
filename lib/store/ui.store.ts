import { create } from 'zustand'

import type { AIModule, ModelKey, ThinkingLevelKey } from '@/types'

interface UIState {
  activeModule: 'improver' | 'builder' | 'prd' | 'templates' | 'history' | 'settings'
  isSidebarOpen: boolean
  thinkingLevels: Record<AIModule, ThinkingLevelKey>
  selectedModels: Record<AIModule, ModelKey>
  setActiveModule: (module: UIState['activeModule']) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setThinkingLevel: (module: AIModule, level: ThinkingLevelKey) => void
  setSelectedModel: (module: AIModule, model: ModelKey) => void
}

/**
 * Store global para estado UI compartido entre modulos.
 * @param none No requiere parametros.
 * @returns Hook Zustand para estado de navegacion y selecciones.
 */
export const useUIStore = create<UIState>((set) => ({
  activeModule: 'improver',
  isSidebarOpen: false,
  thinkingLevels: {
    improver: 'MEDIUM',
    builder: 'MEDIUM',
    prd: 'HIGH',
    templates: 'LOW',
  },
  selectedModels: {
    improver: 'flash',
    builder: 'flash',
    prd: 'pro',
    templates: 'flash',
  },
  setActiveModule: (module) => set({ activeModule: module }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setThinkingLevel: (module, level) =>
    set((state) => ({
      thinkingLevels: {
        ...state.thinkingLevels,
        [module]: level,
      },
    })),
  setSelectedModel: (module, model) =>
    set((state) => ({
      selectedModels: {
        ...state.selectedModels,
        [module]: model,
      },
    })),
}))

export type { UIState }
