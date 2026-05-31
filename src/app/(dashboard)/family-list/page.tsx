'use client'

import React, { useState } from 'react'
import { usePersons, useMarriages, useParentChild, useProfileSearch, useProfile } from '@/hooks/useFamilyData'
import { useFamilyMutations } from '@/hooks/useFamilyMutations'
import { getRelationshipToUser } from '@/utils/relationships'
import { formatDateDMY } from '@/utils/date'
import { getFullName } from '@/utils/name'
import { Person, Profile } from '@/types/database'
import { Search, UserPlus, Edit2, Trash2 } from 'lucide-react'
import AddMemberModal from '@/components/AddMemberModal'
import EditMemberModal from '@/components/EditMemberModal'
import { RelationshipFormData, PersonFormData } from '@/types/forms'
import { cn } from '@/lib/utils'

type PersonWithUser = Person & { is_user: boolean }

export default function FamilyListPage() {
  const { data: profile } = useProfile()
  const { data: persons = [] } = usePersons()
  const { data: marriages = [] } = useMarriages()
  const { data: parentChild = [] } = useParentChild()
  const { addPerson, addRelationship, updatePerson, deletePerson } = useFamilyMutations()
  const searchMutation = useProfileSearch()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [modalType, setModalType] = useState<'add' | 'edit' | 'create' | 'delete' | null>(null)

  // Correctly identify the "user" based on their profile link
  const userPerson = persons.find(p => p.id === profile?.person_id) || null

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    const results = await searchMutation.mutateAsync(searchQuery)
    setSearchResults(results)
  }

  const handleDelete = async () => {
    if (!selectedPerson) return
    await deletePerson(selectedPerson.id)
    setModalType(null)
    setSelectedPerson(null)
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
            onClick={() => { 
              if (userPerson) {
                setSelectedPerson(userPerson);
                setModalType('add');
              } else {
                setModalType('create');
              }
            }}
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
               Search Results
            </h3>
            <button onClick={() => setSearchResults([])} className="text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-red-500 transition-colors">Dismiss</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((profile: Profile) => (
              <div key={profile.id} className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-sand/20 dark:border-sand/10 shadow-sm group hover:border-forest dark:hover:border-sage transition-all">
                <div className="overflow-hidden">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{profile.email?.split('@')[0] || 'Anonymous'}</p>
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
              {persons.map((person: PersonWithUser) => (
                <tr key={person.id} className="group hover:bg-background/30 dark:hover:bg-background/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-forest text-cream flex items-center justify-center font-black text-lg shadow-sm group-hover:rotate-6 transition-transform">
                        {person.first_name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-forest dark:text-sage text-base leading-tight">{getFullName(person)}</span>
                        <span className={cn(
                          "mt-1 w-fit px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                          person.gender === 'male' 
                            ? 'bg-forest/10 text-forest border-forest/20 dark:bg-forest/20' 
                            : 'bg-sage/10 text-forest dark:text-sage border-sage/20 dark:bg-sage/20'
                        )}>
                          {person.gender}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-sand/10 dark:bg-surface px-3 py-1 rounded-lg">
                      {getRelationshipToUser(person, userPerson, persons, marriages, parentChild)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-500">
                    {formatDateDMY(person.birth_date)}
                  </td>
                  <td className="px-8 py-6">
                    {person.is_user ? (
                      <span className="inline-flex items-center px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter bg-sage/10 text-forest dark:text-sage border border-sage/20">
                        Joined
                      </span>
                    ) : (
                      person.invite_code && (
                        <span className="inline-flex items-center px-4 py-1 rounded-xl text-[10px] font-mono font-bold bg-background text-slate-400 dark:bg-background border border-sand/20">
                          {person.invite_code}
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedPerson(person); setModalType('add'); }}
                        title="Add Relationship"
                        className="p-3 bg-surface text-slate-400 hover:text-forest dark:hover:text-sage rounded-xl shadow-sm border border-sand/20 transition-all hover:scale-110"
                      >
                        <UserPlus size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedPerson(person); setModalType('edit'); }}
                        className="p-3 bg-surface text-slate-400 hover:text-forest dark:hover:text-sage rounded-xl shadow-sm border border-sand/20 transition-all hover:scale-110"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedPerson(person); setModalType('delete'); }}
                        disabled={person.is_user}
                        className={cn(
                          "p-3 bg-surface rounded-xl shadow-sm border border-sand/20 transition-all hover:scale-110",
                          person.is_user ? "opacity-30 cursor-not-allowed text-slate-300" : "text-slate-400 hover:text-red-500"
                        )}
                      >
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
          {persons.map((person: PersonWithUser) => (
            <div key={person.id} className="p-6 space-y-5 hover:bg-background/30 dark:hover:bg-background/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-forest text-cream flex items-center justify-center font-black text-xl shadow-md">
                    {person.first_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-forest dark:text-sage text-lg leading-tight">{getFullName(person)}</h4>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                        person.gender === 'male' 
                          ? 'bg-forest/10 text-forest border-forest/20 dark:bg-forest/20' 
                          : 'bg-sage/10 text-forest dark:text-sage border-sage/20 dark:bg-sage/20'
                      )}>
                        {person.gender}
                      </span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                      {getRelationshipToUser(person, userPerson, persons, marriages, parentChild)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedPerson(person); setModalType('add'); }}
                    className="p-2 text-slate-400 bg-sand/10 rounded-lg"
                  >
                    <UserPlus size={16} />
                  </button>
                  <button 
                    onClick={() => { setSelectedPerson(person); setModalType('edit'); }}
                    className="p-2 text-slate-400 bg-sand/10 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => { setSelectedPerson(person); setModalType('delete'); }}
                    disabled={person.is_user}
                    className={cn(
                      "p-2 rounded-lg",
                      person.is_user ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-300" : "text-slate-400 bg-red-50 dark:bg-red-900/10"
                    )}
                  >
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
                  {person.is_user ? (
                    <p className="text-sm font-black text-forest dark:text-sage">JOINED</p>
                  ) : (
                    <p className="text-sm font-mono font-bold text-slate-400">{person.invite_code || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {modalType === 'create' && (
        <EditMemberModal 
          onClose={() => setModalType(null)}
          onSave={async (data: PersonFormData) => {
            await addPerson(data)
            setModalType(null)
          }}
        />
      )}

      {modalType === 'add' && selectedPerson && (
        <AddMemberModal 
          existingPerson={selectedPerson}
          allPersons={persons}
          marriages={marriages}
          isUser={selectedPerson.id === userPerson?.id}
          isParentOfUser={parentChild.some(pc => pc.child_id === userPerson?.id && pc.parent_id === selectedPerson.id)}
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

      {modalType === 'delete' && selectedPerson && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-sand/20 dark:border-sand/10 animate-in fade-in zoom-in duration-200 text-center">
            <div className="h-20 w-20 bg-red-50 dark:bg-red-900/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Delete Family Member?</h3>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              Are you sure you want to remove <span className="text-forest dark:text-sage">{getFullName(selectedPerson)}</span> from your family tree? This action cannot be undone.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4">
              <button 
                onClick={() => setModalType(null)}
                className="py-4 bg-background dark:bg-surface-alt text-slate-400 font-black uppercase tracking-widest rounded-2xl hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/20 transition-all active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
