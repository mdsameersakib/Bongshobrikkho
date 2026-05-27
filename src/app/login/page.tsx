'use client'

import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, TreePine } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          }
        }
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setMessage('Check your email for the confirmation link!')
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dark:bg-background p-6">
      <div className="w-full max-w-md space-y-10 bg-surface p-10 rounded-[2.5rem] shadow-2xl border border-sand/30 dark:border-sand/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-forest/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sage/10 rounded-full blur-3xl" />
        
        <div className="text-center relative z-10">
          <div className="h-16 w-16 bg-forest text-cream rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-forest/20 rotate-3 group hover:rotate-0 transition-transform duration-500">
            <TreePine size={32} />
          </div>
          <h1 className="text-4xl font-black text-forest dark:text-sage tracking-tighter">Bongshobrikkho</h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400 font-bold">
            {isLogin ? 'Welcome back! Sign in to your roots.' : 'Start your family legacy today.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6 relative z-10">
          {error && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-xs font-black uppercase tracking-widest text-red-600 border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}
          
          {message && (
            <div className="rounded-2xl bg-forest/10 dark:bg-sage/20 p-4 text-xs font-black uppercase tracking-widest text-forest dark:text-sage border border-forest/10 dark:border-sage/20 animate-in fade-in slide-in-from-top-1">
              {message}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="displayName">Full Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={!isLogin}
                placeholder="John Doe"
                className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-forest/5 transition-all"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@family.com"
              className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-forest/5 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="password">Security Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-forest/5 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-forest py-4 text-sm font-black text-cream uppercase tracking-[0.2em] shadow-2xl shadow-forest/30 transition-all hover:bg-forest/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center pt-2 relative z-10">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-forest transition-colors"
          >
            {isLogin ? "New to Bongshobrikkho? Join Now" : "Already a member? Sign In"}
          </button>
        </div>
      </div>
    </div>
  )
}
