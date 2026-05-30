'use client'

import React from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, Users } from 'lucide-react'
import { RelationshipFormData, relationshipSchema } from '@/types/forms'
import { Person, Marriage } from '@/types/database'
import { getFullName } from '@/utils/name'
import { cn } from '@/lib/utils'

interface AddMemberModalProps {
  existingPerson: Person
  allPersons: Person[]
  marriages: Marriage[]
  isUser: boolean
  isParentOfUser: boolean
  onSave: (data: RelationshipFormData) => void
  onClose: () => void
}

export default function AddMemberModal({ 
  existingPerson, 
  allPersons, 
  marriages, 
  isUser, 
  isParentOfUser, 
  onSave, 
  onClose 
}: AddMemberModalProps) {
  // Find all spouses of existingPerson to populate the dropdown
  const personSpouses = marriages
    .filter(m => m.person1_id === existingPerson.id || m.person2_id === existingPerson.id)
    .map(m => {
      const spouseId = m.person1_id === existingPerson.id ? m.person2_id : m.person1_id;
      const spousePerson = allPersons.find(p => p.id === spouseId);
      return {
        id: spouseId,
        name: spousePerson ? getFullName(spousePerson) : 'Unknown Spouse',
        status: m.status
      };
    });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RelationshipFormData>({
    resolver: zodResolver(relationshipSchema) as Resolver<RelationshipFormData>,
    defaultValues: {
      relationship_type: 'child',
      other_parent_id: personSpouses.length > 0 ? personSpouses[0].id : null,
      add_both_parents: false,
      is_biological_parent: false,
      person_data: {
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'male',
        is_deceased: false,
        is_private: false,
        country_of_residence: '',
      },
      parent2_data: {
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'female',
        is_deceased: false,
        is_private: false,
        country_of_residence: '',
      },
      marriage_status: 'married',
    }
  })

  const relationshipType = watch('relationship_type')
  const marriageStatus = watch('marriage_status')
  const addBothParents = watch('add_both_parents')
  const selectedOtherParentId = watch('other_parent_id')

  const onSubmit = async (data: RelationshipFormData) => {
    try {
      await onSave(data)
    } catch (err) {
      console.error('Failed to save relative:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-sand/20 dark:border-sand/10 animate-in fade-in zoom-in duration-200 text-slate-800 dark:text-slate-100">
        <div className="p-8">
          <div className="flex items-center justify-between pb-6 border-b border-sand/20 dark:border-sand/10">
            <div>
              <h3 className="text-2xl font-black text-forest dark:text-sage">Add a Relative</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Connecting to: <span className="font-black text-forest dark:text-sage">{getFullName(existingPerson)}</span>
                {existingPerson.is_deceased && <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase">Deceased</span>}
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
            {/* Show top-level errors if any */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">Please fix the following issues:</p>
                <ul className="mt-2 list-disc list-inside text-[10px] text-red-500 font-bold">
                  {errors.person_data?.first_name && <li>First Name is required</li>}
                  {errors.person_data?.gender && <li>Gender is required</li>}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Select Relationship</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['child', 'spouse', 'sibling', 'parent'].map((type) => (
                  <label key={type} className="relative cursor-pointer group">
                    <input 
                      type="radio"
                      value={type}
                      {...register('relationship_type')}
                      className="peer sr-only"
                    />
                    <div className="p-4 bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl text-center transition-all peer-checked:border-forest dark:peer-checked:border-sage peer-checked:bg-forest/5 dark:peer-checked:bg-sage/5">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-tighter peer-checked:text-forest dark:peer-checked:text-sage group-hover:text-forest dark:group-hover:text-sage">{type}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {relationshipType === 'parent' && (
              <div className="flex items-center gap-4 bg-forest/5 p-4 rounded-2xl border border-forest/10 animate-in slide-in-from-top-2">
                <input 
                  type="checkbox" 
                  id="add_both_parents"
                  {...register('add_both_parents')}
                  className="h-5 w-5 rounded-lg border-sand/30 text-forest focus:ring-forest transition-all"
                />
                <div className="space-y-0.5">
                  <label htmlFor="add_both_parents" className="text-sm font-black text-forest dark:text-sage">Add both parents (Couple)</label>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">This will create two people and mark them as married.</p>
                </div>
              </div>
            )}

            {relationshipType === 'spouse' && isParentOfUser && (
              <div className="flex items-center gap-4 bg-forest/5 p-4 rounded-2xl border border-forest/10 animate-in slide-in-from-top-2">
                <input 
                  type="checkbox" 
                  id="is_biological_parent"
                  {...register('is_biological_parent')}
                  className="h-5 w-5 rounded-lg border-sand/30 text-forest focus:ring-forest transition-all"
                />
                <div className="space-y-0.5">
                  <label htmlFor="is_biological_parent" className="text-sm font-black text-forest dark:text-sage">Is this your biological parent?</label>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Check this if this person is also your father/mother.</p>
                </div>
              </div>
            )}

            {relationshipType === 'child' && (
              <div className="space-y-6 pt-6 border-t border-sand/20 dark:border-sand/10 animate-in slide-in-from-top-2">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Select Other Parent</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Which partner is the other parent of this child?</p>
                  </div>
                  <div className="w-full md:w-64">
                    <select 
                      {...register('other_parent_id')}
                      className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="">None (Single Parent)</option>
                      {personSpouses.map(spouse => (
                        <option key={spouse.id} value={spouse.id}>
                          {spouse.name} ({spouse.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {selectedOtherParentId && (
                  <div className="flex items-center gap-3 p-4 bg-forest/5 rounded-2xl border border-forest/10 animate-in fade-in zoom-in">
                    <div className="h-8 w-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold leading-tight">
                      This child will be linked to both <span className="text-forest dark:text-sage font-black">{getFullName(existingPerson)}</span> and <span className="text-forest dark:text-sage font-black">{personSpouses.find(s => s.id === selectedOtherParentId)?.name}</span>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {(relationshipType === 'spouse' || addBothParents) && (
              <div className="space-y-6 pt-6 border-t border-sand/20 dark:border-sand/10 animate-in slide-in-from-top-2">
                <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Marriage Details (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                    <select 
                      {...register('marriage_status')}
                      className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                    >
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="separated">Separated</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marriage Date</label>
                    <input 
                      type="date"
                      {...register('marriage_start_date')}
                      className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                    />
                  </div>
                  {marriageStatus !== 'married' && relationshipType === 'spouse' && (
                    <div className="space-y-2 animate-in fade-in zoom-in">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                      <input 
                        type="date"
                        {...register('marriage_end_date')}
                        className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 dark:border-sand/5 rounded-2xl p-3 text-sm outline-none focus:border-forest dark:focus:border-sage transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-sand/20 dark:border-sand/10">
              <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">
                {addBothParents ? 'Parent 1 Details' : 'New Member Details'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name *</label>
                  <input 
                    {...register('person_data.first_name')}
                    placeholder="First Name" 
                    className={cn(
                      "w-full bg-background dark:bg-surface-alt border-2 rounded-2xl p-3 text-sm outline-none transition-all",
                      errors.person_data?.first_name ? "border-red-500" : "border-sand/20 dark:border-sand/5 focus:border-forest dark:focus:border-sage"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Middle Name</label>
                  <input {...register('person_data.middle_name')} placeholder="Middle Name" className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                  <input {...register('person_data.last_name')} placeholder="Last Name" className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender *</label>
                  <select 
                    {...register('person_data.gender')} 
                    className={cn(
                      "w-full bg-background dark:bg-surface-alt border-2 rounded-2xl p-3 text-sm outline-none transition-all",
                      errors.person_data?.gender ? "border-red-500" : "border-sand/20 dark:border-sand/5 focus:border-forest transition-all"
                    )}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birth Date</label>
                  <input type="date" {...register('person_data.birth_date')} className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Country</label>
                  <input {...register('person_data.country_of_residence')} placeholder="Country" className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all" />
                </div>
              </div>
            </div>

            {addBothParents && (
              <div className="space-y-6 pt-6 border-t-2 border-dashed border-sand/20 animate-in slide-in-from-top-4">
                <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Parent 2 Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name *</label>
                    <input {...register('parent2_data.first_name')} placeholder="First Name" className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Middle Name</label>
                    <input {...register('parent2_data.middle_name')} placeholder="Middle Name" className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                    <input {...register('parent2_data.last_name')} placeholder="Last Name" className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender *</label>
                    <select {...register('parent2_data.gender')} className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birth Date</label>
                    <input type="date" {...register('parent2_data.birth_date')} className="w-full bg-background dark:bg-surface-alt border-2 border-sand/20 rounded-2xl p-3 text-sm outline-none focus:border-forest transition-all" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-sand/20 dark:border-sand/10">
              <h4 className="text-xs font-black text-forest dark:text-sage uppercase tracking-[0.2em]">Privacy Settings</h4>
              <div className="flex items-center gap-4 bg-sand/10 dark:bg-surface-alt p-4 rounded-2xl border border-sand/10">
                <input 
                  type="checkbox" 
                  id="is_private"
                  {...register('person_data.is_private')}
                  className="h-5 w-5 rounded-lg border-sand/30 text-forest focus:ring-forest transition-all"
                />
                <div className="space-y-0.5">
                  <label htmlFor="is_private" className="text-sm font-black text-slate-700 dark:text-slate-200">Private Profile</label>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Hide this relative from your connected network.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-sand/20 dark:border-sand/10">
              <button type="button" onClick={onClose} className="px-8 py-3 text-sm font-black text-slate-400 hover:text-red-500 transition-colors">CANCEL</button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-10 py-3 bg-forest hover:bg-forest/90 text-cream text-sm font-black rounded-2xl shadow-xl shadow-forest/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {addBothParents ? 'ADD PARENT COUPLE' : 'ADD RELATIVE'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
