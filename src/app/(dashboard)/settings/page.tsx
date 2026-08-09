'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { LogOut, User, Shield, Palette, ChevronRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { usePersons, useProfile } from '@/hooks/useFamilyData'
import { useFamilyMutations } from '@/hooks/useFamilyMutations'
import { getFullName } from '@/utils/name'
import EditMemberModal from '@/components/EditMemberModal'
import { PersonFormData } from '@/types/forms'
import { usePrivacySettings, useNetworkMutations } from '@/hooks/useNetworkData'
import { QueryError } from '@/components/QueryState'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const { data: profile, error: profileError } = useProfile()
  const { data: persons = [], error: personsError } = usePersons()
  const { updatePerson } = useFamilyMutations()
  const { data: privacy, error: privacyError } = usePrivacySettings()
  const { updatePrivacy, isPending: privacyPending } = useNetworkMutations()

  const userPerson = persons.find(p => p.id === profile?.person_id)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const toggleTheme = (t: 'light' | 'dark' | 'system') => {
    // If View Transitions API is not supported, switch immediately
    if (!document.startViewTransition) {
      setTheme(t)
      return
    }

    // Start a view transition for a smooth cross-fade
    document.startViewTransition(() => {
      setTheme(t)
    })
  }

  if (!mounted) return null

  if (profileError || personsError || privacyError) return <QueryError error={profileError || personsError || privacyError} />

  return (
    <div className="max-w-6xl mx-auto space-y-10">
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="w-full bg-background/30 dark:bg-background border border-sand/30 dark:border-sand/10 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white">
                  {getFullName(userPerson)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input className="w-full bg-background dark:bg-surface-alt border border-sand/30 dark:border-sand/10 rounded-2xl p-4 text-sm font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed" disabled value={profile?.email || '...'} />
              </div>
            </div>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="bg-forest hover:bg-forest/90 text-cream px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-forest/20 transition-all active:scale-95"
            >
              EDIT PROFILE DETAILS
            </button>
          </div>
        </section>

        <section className="bg-surface rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-sand/10 dark:border-sand/5 flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center"><Shield size={20} /></div><h2 className="text-xl font-black text-forest dark:text-sage">Branch Privacy</h2></div>
          <div className="p-8 space-y-4">
            {([['share_parents', 'Share parents'], ['share_siblings', 'Share siblings'], ['share_children', 'Share children'], ['share_contact_info', 'Share contact information']] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-2xl bg-background/40 p-4 text-sm font-bold text-slate-700 dark:text-slate-200"><span>{label}</span><input type="checkbox" checked={privacy?.[key] ?? (key !== 'share_contact_info')} disabled={privacyPending} onChange={e => updatePrivacy({ [key]: e.target.checked })} className="h-5 w-5 rounded text-forest" /></label>
            ))}
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
              <div className="flex bg-sand/10 dark:bg-background rounded-2xl p-1.5 border border-sand/30 dark:border-sand/10 shadow-inner relative">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTheme(t)}
                    className={cn(
                      "px-8 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 capitalize relative z-10",
                      theme === t
                        ? "bg-white dark:bg-surface text-forest dark:text-sage shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-sand/20 dark:border-sand/10 scale-[1.02]"
                        : "text-slate-400 hover:text-forest dark:hover:text-sage opacity-60 hover:opacity-100"
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

      {isEditingProfile && userPerson && (
        <EditMemberModal 
          person={userPerson}
          onClose={() => setIsEditingProfile(false)}
          onSave={async (data: PersonFormData) => {
            await updatePerson({ id: userPerson.id, data })
            setIsEditingProfile(false)
          }}
        />
      )}
    </div>
  )
}
