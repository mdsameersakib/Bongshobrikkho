'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
    { href: '/family-list', label: 'Family List', emoji: '👨‍👩‍👧‍👦' },
    { href: '/family-tree', label: 'Family Tree', emoji: '🌳' },
    { href: '/family-wall', label: 'Family Wall', emoji: '🗞️' },
    { href: '/events', label: 'Events', emoji: '🎉' },
    { href: '/settings', label: 'Settings', emoji: '⚙️' },
  ]

  return (
    <div className="md:hidden">
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center h-16">
        <h1 className="text-xl font-bold text-blue-600">Bongshobrikkho</h1>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-950 z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Bongshobrikkho</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>
        
        <nav className="px-4 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center p-3 rounded-lg font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-l-4 border-blue-600" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span className="mr-3 text-lg">{link.emoji}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
