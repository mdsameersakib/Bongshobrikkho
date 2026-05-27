'use client'

import React from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Camera, Loader2 } from 'lucide-react'
import { PersonFormData, personSchema } from '@/types/forms'
import { Person } from '@/types/database'
import { cn } from '@/lib/utils'

interface EditMemberModalProps {
  person: Person
  onSave: (data: PersonFormData) => void
  onClose: () => void
}

export default function EditMemberModal({ person, onSave, onClose }: EditMemberModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      first_name: person.first_name || '',
      last_name: person.last_name || '',
      gender: person.gender || 'male',
      birth_date: person.birth_date || '',
      death_date: person.death_date || '',
      is_deceased: person.is_deceased || false,
      profile_image_url: (person as Person & { profile_image_url?: string }).profile_image_url || '', 
    }
  })

  const firstName = watch('first_name')
  const profileImageUrl = watch('profile_image_url')

  const onSubmit = async (data: PersonFormData) => {
    await onSave(data)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Updating: <span className="font-semibold text-blue-600 dark:text-blue-400">{person.first_name} {person.last_name}</span>
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Personal Details</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">First Name</label>
                  <input 
                    {...register('first_name')}
                    placeholder="First Name" 
                    className={cn(
                      "w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 text-sm outline-none transition-all",
                      errors.first_name ? "border-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                    )}
                  />
                  {errors.first_name && <p className="text-[10px] text-red-500">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Last Name</label>
                  <input 
                    {...register('last_name')}
                    placeholder="Last Name" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Gender</label>
                  <select 
                    {...register('gender')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Birth Date</label>
                  <input 
                    type="date"
                    {...register('birth_date')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Profile Image Placeholder */}
              <div className="flex flex-col items-center pt-2">
                <div className="relative group cursor-pointer">
                  <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                    {profileImageUrl ? (
                      <Image 
                        src={profileImageUrl} 
                        alt="Preview" 
                        width={96}
                        height={96}
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <span className="text-3xl font-bold text-slate-300 dark:text-slate-600">
                        {firstName?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Life Status</p>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_deceased"
                  {...register('is_deceased')}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_deceased" className="text-sm font-medium text-slate-700 dark:text-slate-200">Is Deceased</label>
              </div>
              
              {watch('is_deceased') && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                  <label className="text-xs font-medium text-slate-500">Date of Death</label>
                  <input 
                    type="date"
                    {...register('death_date')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
