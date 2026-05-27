'use client'

import React, { useState } from 'react'
import { usePersons, useCouples, useLineage, useProfileSearch } from '@/hooks/useFamilyData'
import { useFamilyMutations } from '@/hooks/useFamilyMutations'
import { getRelationshipToUser } from '@/utils/relationships'
import { formatDateDMY } from '@/utils/date'
import { Person, Profile } from '@/types/database'
import { Search, UserPlus, Edit2, Trash2, Mail, ChevronRight } from 'lucide-react'
import AddMemberModal from '@/components/AddMemberModal'
import EditMemberModal from '@/components/EditMemberModal'
import { RelationshipFormData, PersonFormData } from '@/types/forms'
import { cn } from '@/lib/utils'

export default function FamilyListPage() {
  const { data: persons = [] } = usePersons()
  const { data: couples = [] } = useCouples()
  const { data: lineages = [] } = useLineage()
  const { addRelationship, updatePerson } = useFamilyMutations()
  const searchMutation = useProfileSearch()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null)

  // For this example, we assume the first person is the "user" if we don't have a profile link yet
  const userPerson = persons[0] || null

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    const results = await searchMutation.mutateAsync(searchQuery)
    setSearchResults(results)
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-forest dark:text-sage tracking-tight">Family Members</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your lineage and connect with relatives.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-forest dark:group-focus-within:text-sage transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-surface border border-sand/30 dark:border-sand/10 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-forest/10 dark:focus:ring-sage/10 transition-all w-full lg:w-72 shadow-sm"
            />
          </form>
          <button 
            onClick={() => { setSelectedPerson(userPerson); setModalType('add'); }}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-forest hover:bg-forest/90 text-cream text-sm font-black rounded-2xl shadow-xl shadow-forest/20 transition-all active:scale-95"
          >
            <UserPlus size={20} />
            ADD MEMBER
          </button>
        </div>
      </header>

      {/* Search Results Overlay/Section */}
      {searchResults.length > 0 && (
        <div className="bg-sand/10 dark:bg-surface/40 border-2 border-dashed border-sand/40 dark:border-sand/10 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-forest dark:text-sage uppercase tracking-widest flex items-center gap-2">
              <Mail size={18} /> Search Results
            </h3>
            <button onClick={() => setSearchResults([])} className="text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-red-500 transition-colors">Dismiss</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(profile => (
              <div key={profile.id} className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-sand/20 dark:border-sand/10 shadow-sm group hover:border-forest dark:hover:border-sage transition-all">
                <div className="overflow-hidden">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{profile.display_name || 'Anonymous'}</p>
                  <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                </div>
                <button className="p-2 bg-background dark:bg-background text-forest dark:text-sage rounded-xl hover:bg-forest hover:text-cream transition-all">
                  <UserPlus size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main List Container */}
      <div className="bg-surface rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background/50 dark:bg-surface-alt/50 border-b border-sand/20 dark:border-sand/5">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Relationship</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Birth Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Access Code</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/10 dark:divide-sand/5">
              {persons.map(person => (
                <tr key={person.id} className="group hover:bg-background/30 dark:hover:bg-background/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-forest text-cream flex items-center justify-center font-black text-lg shadow-sm group-hover:rotate-6 transition-transform">
                        {person.first_name[0]}
                      </div>
                      <span className="font-black text-forest dark:text-sage text-base">{person.first_name} {person.last_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-sand/10 dark:bg-surface px-3 py-1 rounded-lg">
                      {getRelationshipToUser(person, userPerson, persons, couples, lineages)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-500">
                    {formatDateDMY(person.birth_date)}
                  </td>
                  <td className="px-8 py-6">
                    {person.claimed_by_uid ? (
                      <span className="inline-flex items-center px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter bg-sage/10 text-forest dark:text-sage border border-sage/20">
                        Joined
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-4 py-1 rounded-xl text-[10px] font-mono font-bold bg-background text-slate-400 dark:bg-background border border-sand/20">
                        {person.invitation_code}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedPerson(person); setModalType('edit'); }}
                        className="p-3 bg-surface text-slate-400 hover:text-forest dark:hover:text-sage rounded-xl shadow-sm border border-sand/20 transition-all hover:scale-110"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button className="p-3 bg-surface text-slate-400 hover:text-red-500 rounded-xl shadow-sm border border-sand/20 transition-all hover:scale-110">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-sand/10 dark:divide-sand/5">
          {persons.map(person => (
            <div key={person.id} className="p-6 space-y-5 hover:bg-background/30 dark:hover:bg-background/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-forest text-cream flex items-center justify-center font-black text-xl shadow-md">
                    {person.first_name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-forest dark:text-sage text-lg">{person.first_name} {person.last_name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                      {getRelationshipToUser(person, userPerson, persons, couples, lineages)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedPerson(person); setModalType('edit'); }}
                    className="p-2 text-slate-400 bg-sand/10 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-slate-400 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-sand/5 dark:bg-surface-alt/50 p-4 rounded-2xl border border-sand/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Birth Date</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatDateDMY(person.birth_date)}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status</p>
                  {person.claimed_by_uid ? (
                    <p className="text-sm font-black text-forest dark:text-sage">JOINED</p>
                  ) : (
                    <p className="text-sm font-mono font-bold text-slate-400">{person.invitation_code}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {modalType === 'add' && selectedPerson && (
        <AddMemberModal 
          existingPerson={selectedPerson}
          onClose={() => setModalType(null)}
          onSave={async (data: RelationshipFormData) => {
            await addRelationship({ existingPersonId: selectedPerson.id, data })
            setModalType(null)
          }}
        />
      )}

      {modalType === 'edit' && selectedPerson && (
        <EditMemberModal 
          person={selectedPerson}
          onClose={() => setModalType(null)}
          onSave={async (data: PersonFormData) => {
            await updatePerson({ id: selectedPerson.id, data })
            setModalType(null)
          }}
        />
      )}
    </div>
  )
}
