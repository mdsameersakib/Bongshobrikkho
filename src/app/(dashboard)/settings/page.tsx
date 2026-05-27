'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { LogOut, User, Shield, Palette, ChevronRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!mounted) return null

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header>
        <h1 className="text-4xl font-black text-forest dark:text-sage tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Personalize your experience and manage your account.</p>
      </header>

      <div className="grid gap-8">
        {/* Profile Section */}
        <section className="bg-surface rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-sand/10 dark:border-sand/5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
              <User size={20} />
            </div>
            <h2 className="text-xl font-black text-forest dark:text-sage">Profile Details</h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                <input className="w-full bg-background/30 dark:bg-background border border-sand/30 dark:border-sand/10 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all" placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input className="w-full bg-background dark:bg-surface-alt border border-sand/30 dark:border-sand/10 rounded-2xl p-4 text-sm font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed" disabled value="user@family.com" />
              </div>
            </div>
            <button className="bg-forest hover:bg-forest/90 text-cream px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-forest/20 transition-all active:scale-95">
              SAVE CHANGES
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-surface rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-sand/10 dark:border-sand/5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-sage/20 text-forest flex items-center justify-center">
              <Palette size={20} />
            </div>
            <h2 className="text-xl font-black text-forest dark:text-sage">Appearance</h2>
          </div>
          <div className="p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="font-black text-slate-800 dark:text-white">Theme Selection</p>
                <p className="text-xs text-slate-500 font-bold mt-1">Choose between light, dark, or system preferences.</p>
              </div>
              <div className="flex bg-background dark:bg-background rounded-2xl p-1.5 border border-sand/20 shadow-inner">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all capitalize",
                      theme === t
                        ? "bg-forest text-cream shadow-xl"
                        : "text-slate-500 hover:text-forest dark:hover:text-sage"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-surface rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-sand/10 dark:border-sand/5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-black text-red-600">Account Security</h2>
          </div>
          <div className="p-8">
            <button 
              onClick={handleLogout}
              disabled={loading}
              className="group flex items-center gap-3 text-red-500 hover:text-red-700 font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
            >
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogOut size={20} />
              </div>
              {loading ? 'Signing out...' : 'Sign Out of Bongshobrikkho'}
              <ChevronRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
