'use client'

import React from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2 } from 'lucide-react'
import { PersonFormData, personSchema } from '@/types/forms'
import { Person } from '@/types/database'
import { cn } from '@/lib/utils'

interface EditMemberModalProps {
  person?: Person // Optional: if provided, we edit. If not, we create.
  onSave: (data: PersonFormData) => void
  onClose: () => void
}

export default function EditMemberModal({ person, onSave, onClose }: EditMemberModalProps) {
  const isEditing = !!person

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema) as Resolver<PersonFormData>,
    defaultValues: {
      first_name: person?.first_name || '',
      middle_name: person?.middle_name || '',
      last_name: person?.last_name || '',
      gender: (person?.gender as 'male' | 'female' | 'other') || 'male',
      birth_date: person?.birth_date || '',
      death_date: person?.death_date || '',
      is_deceased: person?.is_deceased || false,
      is_private: person?.is_private || false,
      country_of_residence: person?.country_of_residence || '',
      address: person?.address || '',
      phone_number: person?.phone_number || '',
      email: person?.email || '',
    }
  })

  const onSubmit = async (data: PersonFormData) => {
    await onSave(data)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-sand/20 dark:border-sand/10 animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between pb-6 border-b border-sand/20 dark:border-sand/10">
            <div>
              <h3 className="text-2xl font-black text-forest dark:text-sage">{isEditing ? 'Edit Member' : 'Add New Member'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isEditing ? `Updating profile for ${person?.first_name}` : 'Create a standalone profile in your family list.'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-forest dark:hover:text-sage transition-colors"
            >
              <X size={28} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Personal Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                  <input 
                    {...register('first_name')}
                    placeholder="First Name" 
                    className={cn(
                      "w-full bg-background dark:bg-surface-alt border-2 rounded-2xl p-3 text-sm outline-none transition-all",
                      errors.first_name ? "border-red-500" : "border-sand/20 dark:border-sand/5 focus:border-forest dark:focus:border-sage"
                    )}
                  />
                  {errors.first_name && <p className="text-[10px] text-red-500 font-bold">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Middle Name</label>
                  <input 
                    {...register('middle_name')}
                    placeholder="Middle Name" 
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                  <input 
                    {...register('last_name')}
                    placeholder="Last Name" 
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                  <select 
                    {...register('gender')}
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birth Date</label>
                  <input 
                    type="date"
                    {...register('birth_date')}
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Country</label>
                  <input 
                    {...register('country_of_residence')}
                    placeholder="e.g. Bangladesh"
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-sand/20 dark:border-sand/10">
              <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Contact Information (Optional)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                  <input 
                    {...register('email')}
                    placeholder="email@example.com" 
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/10 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    {...register('phone_number')}
                    placeholder="+880..." 
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/10 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                  <input 
                    {...register('address')}
                    placeholder="Full Address" 
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/10 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-sand/20 dark:border-sand/10">
              <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Privacy Settings</h4>
              <div className="flex items-center gap-4 bg-sand/10 dark:bg-surface-alt p-4 rounded-2xl border border-sand/10">
                <input 
                  type="checkbox" 
                  id="is_private"
                  {...register('is_private')}
                  className="h-5 w-5 rounded-lg border-sand/30 text-forest focus:ring-forest transition-all"
                />
                <div className="space-y-0.5">
                  <label htmlFor="is_private" className="text-sm font-black text-slate-700 dark:text-slate-200">Private Profile</label>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Only you can see this person in your network.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-sand/20 dark:border-sand/10">
              <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Life Status</h4>
              <div className="flex items-center gap-4 bg-sand/10 dark:bg-surface-alt p-4 rounded-2xl border border-sand/10">
                <input 
                  type="checkbox" 
                  id="is_deceased"
                  {...register('is_deceased')}
                  className="h-5 w-5 rounded-lg border-sand/30 text-forest focus:ring-forest transition-all"
                />
                <label htmlFor="is_deceased" className="text-sm font-black text-slate-700 dark:text-slate-200">This person is deceased</label>
              </div>
              
              {watch('is_deceased') && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Death</label>
                  <input 
                    type="date"
                    {...register('death_date')}
                    className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-sand/20 dark:border-sand/10">
              <button 
                type="button" 
                onClick={onClose}
                className="px-8 py-3 text-sm font-black text-slate-400 hover:text-red-500 transition-colors"
              >
                CANCEL
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-10 py-3 bg-forest hover:bg-forest/90 text-cream text-sm font-black rounded-2xl shadow-xl shadow-forest/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {isEditing ? 'UPDATE PROFILE' : 'SAVE MEMBER'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
