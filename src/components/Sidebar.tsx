'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  Newspaper, 
  Calendar, 
  Settings,
  type LucideIcon 
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

interface SidebarLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
  onClick?: () => void
}

const SidebarLink = ({ href, icon: Icon, children, onClick }: SidebarLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center p-3 my-1 rounded-lg font-medium transition-all duration-200 group",
        isActive 
          ? "bg-forest/10 dark:bg-sage/20 text-forest dark:text-sage shadow-sm border-l-4 border-forest dark:border-sage" 
          : "text-slate-600 dark:text-slate-400 hover:bg-forest/5 dark:hover:bg-sage/10 hover:text-forest dark:hover:text-sage"
      )}
    >
      <Icon className={cn(
        "mr-3 size-5 transition-transform duration-200 group-hover:scale-110",
        isActive ? "text-forest dark:text-sage" : "text-slate-400 group-hover:text-forest dark:group-hover:text-sage"
      )} />
      <span className="truncate">{children}</span>
    </Link>
  )
}

export default function Sidebar() {
  const [user, setUser] = useState<{ display_name?: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser.user_metadata)
      }
    }
    getUser()
  }, [supabase])

  const initials = user?.display_name 
    ? user.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <aside className="hidden md:flex md:w-64 bg-surface flex-shrink-0 flex-col border-r border-sand/30 dark:border-sand/10">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-forest dark:text-sage tracking-tight">Bongshobrikkho</h1>
      </div>
      <nav className="mt-6 px-4 flex-1">
        <SidebarLink href="/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>
        <SidebarLink href="/family-list" icon={Users}>Family List</SidebarLink>
        <SidebarLink href="/family-tree" icon={Network}>Family Tree</SidebarLink>
        <SidebarLink href="/family-wall" icon={Newspaper}>Family Wall</SidebarLink>
        <SidebarLink href="/events" icon={Calendar}>Events</SidebarLink>
        <SidebarLink href="/settings" icon={Settings}>Settings</SidebarLink>
      </nav>
      <div className="p-4 border-t border-sand/20 dark:border-sand/10 bg-background/30 dark:bg-transparent">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-forest text-cream flex items-center justify-center font-bold shadow-sm">
            {initials}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-100">
              {user?.display_name || 'User Profile'}
            </p>
            <p className="text-xs text-slate-500 truncate">Manage Account</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
