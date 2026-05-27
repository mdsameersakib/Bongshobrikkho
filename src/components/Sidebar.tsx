'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SidebarLinkProps {
  href: string
  emoji: string
  children: React.ReactNode
  onClick?: () => void
}

const SidebarLink = ({ href, emoji, children, onClick }: SidebarLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center p-3 my-1 rounded-lg font-medium transition-all duration-150",
        isActive 
          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border-l-4 border-blue-600" 
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <span className="mr-3 text-lg leading-none" aria-hidden="true">{emoji}</span>
      <span className="truncate">{children}</span>
    </Link>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 bg-white dark:bg-slate-950 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">Bongshobrikkho</h1>
      </div>
      <nav className="mt-6 px-4 flex-1">
        <SidebarLink href="/dashboard" emoji="📊">Dashboard</SidebarLink>
        <SidebarLink href="/family-list" emoji="👨‍👩‍👧‍👦">Family List</SidebarLink>
        <SidebarLink href="/family-tree" emoji="🌳">Family Tree</SidebarLink>
        <SidebarLink href="/family-wall" emoji="🗞️">Family Wall</SidebarLink>
        <SidebarLink href="/events" emoji="🎉">Events</SidebarLink>
        <SidebarLink href="/settings" emoji="⚙️">Settings</SidebarLink>
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        {/* User profile section will be updated with real data later */}
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-semibold">
            U
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">User Profile</p>
            <p className="text-xs text-slate-500 truncate">Settings</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
