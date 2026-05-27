'use client'

import React from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Camera, Loader2 } from 'lucide-react'
import { RelationshipFormData, relationshipSchema } from '@/types/forms'
import { Person } from '@/types/database'
import { cn } from '@/lib/utils'

interface AddMemberModalProps {
  existingPerson: Person
  onSave: (data: RelationshipFormData) => void
  onClose: () => void
}

export default function AddMemberModal({ existingPerson, onSave, onClose }: AddMemberModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RelationshipFormData>({
    resolver: zodResolver(relationshipSchema),
    defaultValues: {
      relationship_type: 'child',
      person_data: {
        gender: 'male',
        is_deceased: false,
      }
    }
  })

  const firstName = watch('person_data.first_name')
  const profileImageUrl = watch('person_data.profile_image_url')

  const onSubmit = async (data: RelationshipFormData) => {
    await onSave(data)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add a Relative</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Adding relative to: <span className="font-semibold text-blue-600 dark:text-blue-400">{existingPerson.first_name}</span>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Relationship Type</label>
              <select 
                {...register('relationship_type')}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="child">Child (Son/Daughter)</option>
                <option value="sibling">Sibling (Brother/Sister)</option>
                <option value="spouse">Spouse (Husband/Wife)</option>
              </select>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">New Member Details</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <input 
                    {...register('person_data.first_name')}
                    placeholder="First Name" 
                    className={cn(
                      "w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 text-sm outline-none transition-all",
                      errors.person_data?.first_name ? "border-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                    )}
                  />
                  {errors.person_data?.first_name && <p className="text-[10px] text-red-500">{errors.person_data.first_name.message}</p>}
                </div>
                <div className="space-y-1">
                  <input 
                    {...register('person_data.last_name')}
                    placeholder="Last Name" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <select 
                    {...register('person_data.gender')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <input 
                    type="date"
                    {...register('person_data.birth_date')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Profile Image Placeholder */}
              <div className="flex flex-col items-center pt-4">
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
                <p className="text-[10px] text-slate-500 mt-2">Click to upload photo (Cloudinary integration pending)</p>
              </div>
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
                Add Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
