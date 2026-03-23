'use client'
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, User as UserIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'
import { navItems, type NavItem } from './sidebar'
import { cn } from '@/lib/utils/cn'
// createSupabaseBrowserClient imported but not used here — topbar receives user as prop
import type { User } from '@supabase/supabase-js'

export function Topbar({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()

  // Close drawer on path change
  React.useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-border bg-(--color-bg)/80 backdrop-blur-md px-4 xl:hidden">
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Kami Prompter" width={20} height={20} className="shrink-0" priority />
          <span className="text-sm font-semibold tracking-tight">Kami Prompter</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/app/settings" className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-surface-overlay text-text-primary">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
            ) : (
              <UserIcon size={16} />
            )}
          </Link>
          <button 
            onClick={() => setIsOpen(true)}
            className="md:hidden p-1.5 text-text-secondary hover:text-text-primary"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-60 flex flex-col bg-(--color-bg) shadow-2xl xl:hidden"
            >
              <div className="flex h-14 items-center justify-between px-4 border-b border-border">
                <span className="text-sm font-semibold tracking-tight text-text-primary">Menú</span>
                <button onClick={() => setIsOpen(false)} className="p-1.5 text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {navItems.map((item: NavItem) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors',
                        isActive ? 'text-accent bg-accent-subtle border-l-2 border-accent' : 'text-text-secondary border-l-2 border-transparent'
                      )}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
              <div className="p-4 border-t border-border">
                 <Link href="/app/settings" className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-overlay text-text-primary">
                      {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <UserIcon size={16} />
                      )}
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-text-primary">Configuración</span>
                    </div>
                 </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
