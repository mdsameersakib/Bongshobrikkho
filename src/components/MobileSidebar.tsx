'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Network, 
  Newspaper, 
  Calendar, 
  Settings 
} from 'lucide-react'

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/family-list', label: 'Family List', icon: Users },
    { href: '/family-tree', label: 'Family Tree', icon: Network },
    { href: '/family-wall', label: 'Family Wall', icon: Newspaper },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="md:hidden">
      <header className="bg-surface border-b border-sand/20 dark:border-sand/10 p-4 flex justify-between items-center h-16 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 flex-shrink-0 bg-white rounded-full p-1 shadow-sm border border-sand/10">
            <Image 
              src="/BongshoBrikkho.svg" 
              alt="Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-lg font-black text-sage tracking-tighter uppercase">BongshoBrikkho</h1>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-forest/10 dark:hover:bg-sage/10 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-72 bg-background dark:bg-surface z-50 transform transition-transform duration-300 ease-in-out border-r border-sand/30 dark:border-sand/10 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center border-b border-sand/20 dark:border-sand/5">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 bg-white rounded-full p-1.5 shadow-sm border border-sand/10">
              <Image 
                src="/BongshoBrikkho.svg" 
                alt="Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-black text-sage tracking-tighter uppercase">BongshoBrikkho</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400">
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 mt-4">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center p-4 rounded-xl font-bold transition-all duration-200",
                  isActive 
                    ? "bg-forest text-cream shadow-lg shadow-forest/20 translate-x-1" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-forest/10 hover:text-forest dark:hover:text-sage"
                )}
              >
                <Icon className={cn("mr-4 size-5", isActive ? "text-cream" : "text-slate-400")} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-sand/20 dark:border-sand/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-forest text-cream flex items-center justify-center font-black">
              U
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">User Profile</p>
              <p className="text-xs text-slate-500">Settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
