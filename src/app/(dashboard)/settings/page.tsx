'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { LogOut, User, Shield, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your profile and account preferences.</p>
      </header>

      <div className="grid gap-6">
        {/* Profile Section */}
        <section className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center gap-3">
            <User className="text-blue-600" size={20} />
            <h2 className="font-bold">Profile Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Display Name</label>
                <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm" placeholder="Your name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm" disabled value="user@example.com" />
              </div>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm">Save Changes</button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center gap-3">
            <Palette className="text-purple-600" size={20} />
            <h2 className="font-bold">Appearance</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-xs text-slate-500">Switch between light and dark themes.</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                <button className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-800 shadow-sm rounded-md">Light</button>
                <button className="px-3 py-1 text-xs font-bold text-slate-500">Dark</button>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center gap-3">
            <Shield className="text-red-600" size={20} />
            <h2 className="font-bold">Account Security</h2>
          </div>
          <div className="p-6">
            <button 
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold transition-colors"
            >
              <LogOut size={20} />
              {loading ? 'Signing out...' : 'Sign Out of Bongshobrikkho'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
