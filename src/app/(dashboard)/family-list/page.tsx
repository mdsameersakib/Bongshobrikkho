'use client'

import React, { useState, useMemo } from 'react'
import { usePersons, useCouples, useLineage, useProfileSearch } from '@/hooks/useFamilyData'
import { useFamilyMutations } from '@/hooks/useFamilyMutations'
import { getRelationshipToUser } from '@/utils/relationships'
import { formatDateDMY } from '@/utils/date'
import { Person, Profile } from '@/types/database'
import { Search, UserPlus, Heart, Users, Edit2, Trash2, Mail } from 'lucide-react'
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
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Family List</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your family and connections.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-64"
            />
          </form>
          <button 
            onClick={() => { setSelectedPerson(userPerson); setModalType('add'); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all"
          >
            <UserPlus size={18} />
            Add Member
          </button>
        </div>
      </header>

      {/* Search Results Overlay/Section */}
      {searchResults.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Mail size={16} /> Search Results
          </h3>
          <div className="grid gap-2">
            {searchResults.map(profile => (
              <div key={profile.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20 shadow-sm">
                <span className="text-sm font-medium">{profile.email}</span>
                <button className="text-xs font-bold text-blue-600 hover:underline">Send Request</button>
              </div>
            ))}
          </div>
          <button onClick={() => setSearchResults([])} className="mt-3 text-xs text-slate-500 hover:underline">Clear results</button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Relationship</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Birth Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
            {persons.map(person => (
              <tr key={person.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                      {person.first_name[0]}
                    </div>
                    <span className="text-sm font-semibold">{person.first_name} {person.last_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {getRelationshipToUser(person, userPerson, persons, couples, lineages)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {formatDateDMY(person.birth_date)}
                </td>
                <td className="px-6 py-4">
                  {person.claimed_by_uid ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Claimed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      {person.invitation_code}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setSelectedPerson(person); setModalType('edit'); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {persons.map(person => (
          <div key={person.id} className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg">
                {person.first_name[0]}
              </div>
              <div>
                <h4 className="font-bold">{person.first_name} {person.last_name}</h4>
                <p className="text-xs text-slate-500">{getRelationshipToUser(person, userPerson, persons, couples, lineages)}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Born: {formatDateDMY(person.birth_date)}</span>
              {person.claimed_by_uid ? (
                <span className="text-green-600 font-bold">Claimed</span>
              ) : (
                <span className="font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded">{person.invitation_code}</span>
              )}
            </div>

            <div className="flex border-t border-slate-100 dark:border-slate-900 pt-4 gap-2">
              <button 
                onClick={() => { setSelectedPerson(person); setModalType('edit'); }}
                className="flex-1 flex justify-center py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button className="flex-1 flex justify-center py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
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
