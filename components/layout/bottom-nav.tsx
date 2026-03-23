'use client'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { navItems, type NavItem } from './sidebar'

// 5 items for the bottom bar: Dashboard, Improver, Builder, Templates, More
const bottomNavItems: NavItem[] = [
  ...navItems.filter(i => ['dashboard', 'improver', 'builder', 'templates'].includes(i.id)),
  { id: 'more', label: 'Más', icon: MoreHorizontal, href: '/app/settings' } // As a fallback for "More"
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 bg-(--color-bg) border-t border-border md:hidden safe-area-bottom">
      {bottomNavItems.map((item) => {
        // Approximate active state mapping
        const isActive = item.id === 'more' 
            ? ['/app/history', '/app/settings', '/app/prd'].some(path => pathname.startsWith(path))
            : pathname.startsWith(item.href)
            
        const Icon = item.icon

        return (
          <Link
            key={item.id}
            href={item.id === 'more' ? '/app/history' : item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-accent" : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Icon size={20} className={isActive ? "stroke-[2.5]" : ""} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
