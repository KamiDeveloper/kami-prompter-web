'use client'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  href: string
}
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import {
  LayoutDashboard, Wand2, Blocks, FileText,
  Library, History, Settings, User as UserIcon
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSettingsStore } from '@/lib/store/settings.store'
import type { User } from '@supabase/supabase-js'

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/app/dashboard' },
  { id: 'improver',  label: 'Improver',  icon: Wand2,           href: '/app/improver' },
  { id: 'builder',   label: 'Builder',   icon: Blocks,          href: '/app/builder' },
  { id: 'prd',       label: 'PRD Maker', icon: FileText,        href: '/app/prd' },
  { id: 'templates', label: 'Templates', icon: Library,         href: '/app/templates' },
  { id: 'history',   label: 'History',   icon: History,         href: '/app/history' },
]

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const apiKeyStatus = useSettingsStore(state => state.apiKeyStatus)
  const isAnyKeyMissing = apiKeyStatus.flash === 'not_configured' || apiKeyStatus.pro === 'not_configured' || apiKeyStatus.flash === 'invalid' || apiKeyStatus.pro === 'invalid'

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-(--color-bg) xl:flex">
      <div className="flex h-14 items-center gap-2 px-6 border-b border-border">
        <Image src="/logo.svg" alt="Kami Prompter" width={20} height={20} className="shrink-0" priority />
        <span className="text-sm font-semibold tracking-tight">Kami Prompter</span>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <div key={item.id} className="relative">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-accent-subtle rounded-md border-l-2 border-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Link
                href={item.href}
                className={cn(
                  'relative z-10 flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-md',
                  isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/app/settings"
          className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-raised"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-text-primary">
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
            ) : (
              <UserIcon size={16} />
            )}
            {isAnyKeyMissing && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-error border-2 border-(--color-bg)"></span>
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-text-primary">
              {user?.user_metadata?.full_name || user?.email || 'Usuario'}
            </span>
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <Settings size={12} />
              <span>Configuración</span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  )
}
