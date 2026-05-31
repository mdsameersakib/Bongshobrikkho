'use client'

import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { Loader2, ChevronLeft, ChevronRight, Mail, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState(1) // For multi-step signup
  
  // Auth Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Profile Fields (Signup)
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('male')
  const [birthDate, setBirthDate] = useState('')
  const [country, setCountry] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLogin && step < 2) {
      setStep(2)
      return
    }

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
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            gender: gender,
            birth_date: birthDate || null,
            country_of_residence: country,
          }
        }
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setMessage('Welcome to the family! Please check your email to confirm your account.')
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setIsLogin(!isLogin)
    setStep(1)
    setError(null)
    setMessage(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-texture p-6">
      <div className={cn(
        "w-full transition-all duration-500 bg-white dark:bg-surface p-10 rounded-[2.5rem] shadow-2xl border border-sand/30 dark:border-sand/10 relative overflow-hidden",
        isLogin ? "max-w-md" : "max-w-2xl"
      )}>
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-forest/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sage/10 rounded-full blur-3xl" />
        
        <div className="text-center relative z-10 mb-10">
          <div className="relative h-24 w-full mb-6">
            <Image 
              src="/BongshoBrikkho.svg" 
              alt="BongshoBrikkho Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
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
            <div className="rounded-2xl bg-forest/10 dark:bg-sage/20 p-4 text-xs font-black uppercase tracking-widest text-forest dark:text-sage border border-forest/10 dark:border-sage/20 animate-in fade-in slide-in-from-top-1 text-center">
              {message}
            </div>
          )}

          {!message && (
            <>
              {isLogin ? (
                /* LOGIN FORM */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="name@family.com"
                        className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt pl-12 pr-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt pl-12 pr-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* SIGNUP MULTI-STEP FORM */
                <div className="space-y-6">
                  {step === 1 ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                      <p className="text-[10px] font-black text-forest dark:text-sage uppercase tracking-[0.2em] mb-4">Step 1: Account Credentials</p>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="name@family.com"
                          className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Choose Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                      <div className="flex items-center gap-2 mb-4">
                        <button type="button" onClick={() => setStep(1)} className="p-2 hover:bg-forest/5 rounded-full text-forest dark:text-sage transition-colors">
                          <ChevronLeft size={20} />
                        </button>
                        <p className="text-[10px] font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Step 2: Personal Profile</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            placeholder="First"
                            className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</label>
                          <input
                            type="text"
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                            placeholder="Middle"
                            className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            placeholder="Last"
                            className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                          <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residence</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="e.g. Bangladesh"
                            className="w-full rounded-2xl border border-sand/30 dark:border-sand/10 bg-background/50 dark:bg-surface-alt px-6 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-forest/5 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-forest py-4 text-sm font-black text-cream uppercase tracking-[0.2em] shadow-2xl shadow-forest/30 transition-all hover:bg-forest/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    {isLogin ? 'Sign In' : (step === 1 ? 'Next Step' : 'Create Account')}
                    {!isLogin && step === 1 ? <ChevronRight size={18} /> : null}
                  </>
                )}
              </button>
            </>
          )}
        </form>

        <div className="text-center pt-6 relative z-10">
          <button 
            onClick={resetForm}
            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-forest transition-colors"
          >
            {isLogin ? "New to Bongshobrikkho? Join Now" : "Already a member? Sign In"}
          </button>
        </div>
      </div>
    </div>
  )
}
