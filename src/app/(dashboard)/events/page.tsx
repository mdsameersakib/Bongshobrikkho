'use client'

import React, { useMemo, useState } from 'react'
import { useEvents, useEventMutations } from '@/hooks/useEventData'
import { usePersons, useMarriages } from '@/hooks/useFamilyData'
import { Plus, Calendar, MapPin, Info, Gift, Heart, Music, type LucideIcon, Sparkles, X, Pencil, Trash2 } from 'lucide-react'
import { formatDateDMY } from '@/utils/date'
import { cn } from '@/lib/utils'
import { FamilyEvent } from '@/types/database'
import { QueryError } from '@/components/QueryState'

type DisplayEvent = FamilyEvent & { person?: { first_name: string, last_name: string | null }, generated?: boolean }
type EventForm = { event_type: string; event_date: string; location: string; description: string; person_id: string; marriage_id: string }

const emptyForm: EventForm = { event_type: 'gathering', event_date: '', location: '', description: '', person_id: '', marriage_id: '' }

const EventCard = ({ event, onView, onEdit, onDelete }: { event: DisplayEvent; onView: () => void; onEdit: () => void; onDelete: () => void }) => {
  const types: Record<string, { icon: LucideIcon, color: string }> = {
    birthday: { icon: Gift, color: 'bg-forest/10 text-forest' },
    anniversary: { icon: Heart, color: 'bg-red-50 text-red-500' },
    gathering: { icon: Music, color: 'bg-sage/10 text-forest' },
    memorial: { icon: Info, color: 'bg-slate-100 text-slate-600' },
    default: { icon: Info, color: 'bg-sand/20 text-slate-600' },
  }
  const { icon: Icon, color } = types[event.event_type] || types.default

  return (
    <div className="bg-surface p-6 rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", color)}><Icon size={28} /></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-background dark:bg-surface-alt px-3 py-1 rounded-full border border-sand/10">{event.event_type}</span>
      </div>
      <div className="space-y-4">
        <h4 className="font-black text-xl text-forest dark:text-sage leading-tight">{event.description || `${event.person?.first_name || 'Family'}'s Special Day`}</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400"><div className="h-8 w-8 rounded-lg bg-sand/10 flex items-center justify-center text-forest"><Calendar size={16} /></div><span>{formatDateDMY(event.event_date)}</span></div>
          {event.location && <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400"><div className="h-8 w-8 rounded-lg bg-sand/10 flex items-center justify-center text-forest"><MapPin size={16} /></div><span className="truncate">{event.location}</span></div>}
        </div>
      </div>
      <div className="mt-8 flex gap-2">
        <button type="button" onClick={onView} className="flex-1 py-3 bg-background text-forest dark:text-sage font-black text-xs uppercase tracking-widest rounded-xl border border-sand/30 hover:bg-forest hover:text-cream transition-all">VIEW DETAILS</button>
        {!event.generated && <><button type="button" onClick={onEdit} title="Edit event" className="rounded-xl border border-sand/30 px-3 text-slate-400 hover:text-forest"><Pencil size={16} /></button><button type="button" onClick={onDelete} title="Delete event" className="rounded-xl border border-sand/30 px-3 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></>}
      </div>
    </div>
  )
}

export default function EventsPage() {
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useEvents()
  const { data: persons = [], error: personsError } = usePersons()
  const { data: marriages = [], error: marriagesError } = useMarriages()
  const { addEvent, updateEvent, deleteEvent, isAdding } = useEventMutations()
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [editing, setEditing] = useState<DisplayEvent | null>(null)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<DisplayEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const displayEvents = useMemo<DisplayEvent[]>(() => {
    const year = new Date().getFullYear()
    const recurring: DisplayEvent[] = []
    persons.forEach(person => {
      if (person.birth_date) recurring.push({ id: `birthday-${person.id}`, event_type: 'birthday', event_date: `${year}-${person.birth_date.slice(5)}`, description: `${person.first_name}'s Birthday`, location: null, person_id: person.id, marriage_id: null, created_at: null, generated: true, person: { first_name: person.first_name, last_name: person.last_name } })
      if (person.is_deceased && person.death_date) recurring.push({ id: `memorial-${person.id}`, event_type: 'memorial', event_date: `${year}-${person.death_date.slice(5)}`, description: `${person.first_name}'s Memorial Day`, location: null, person_id: person.id, marriage_id: null, created_at: null, generated: true, person: { first_name: person.first_name, last_name: person.last_name } })
    })
    marriages.forEach(marriage => {
      if (!marriage.start_date) return
      recurring.push({ id: `anniversary-${marriage.id}`, event_type: 'anniversary', event_date: `${year}-${marriage.start_date.slice(5)}`, description: 'Marriage Anniversary', location: null, person_id: null, marriage_id: marriage.id, created_at: null, generated: true })
    })
    return [...events, ...recurring].sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''))
  }, [events, marriages, persons])

  const openCreate = () => { setEditing(null); setCreating(true); setForm({ ...emptyForm }); setError(null) }
  const openEdit = (event: DisplayEvent) => { setCreating(false); setEditing(event); setForm({ event_type: event.event_type, event_date: event.event_date || '', location: event.location || '', description: event.description || '', person_id: event.person_id || '', marriage_id: event.marriage_id || '' }); setError(null) }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      const data = { event_type: form.event_type, event_date: form.event_date || null, location: form.location || null, description: form.description || null, person_id: form.person_id || null, marriage_id: form.marriage_id || null }
      if (editing) await updateEvent({ id: editing.id, data })
      else await addEvent(data)
      setEditing(null)
      setCreating(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save the event.') }
  }

  if (eventsError || personsError || marriagesError) return <QueryError error={eventsError || personsError || marriagesError} />

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-6"><div><h1 className="text-4xl font-black text-forest dark:text-sage tracking-tight">Family Events</h1><p className="text-slate-500 dark:text-slate-400 mt-2">Celebrate every milestone together.</p></div><button type="button" onClick={openCreate} className="bg-forest hover:bg-forest/90 text-cream px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-forest/20 transition-all flex items-center justify-center gap-2 active:scale-95"><Plus size={20} />ADD EVENT</button></header>
      {error && <QueryError error={new Error(error)} />}
      {eventsLoading ? <div className="rounded-3xl bg-surface p-12 text-center font-black text-forest">Loading events...</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{displayEvents.map(event => <EventCard key={event.id} event={event} onView={() => setViewing(event)} onEdit={() => openEdit(event)} onDelete={async () => { try { await deleteEvent(event.id) } catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete the event.') } }} />)}{displayEvents.length === 0 && <div className="col-span-full py-24 text-center bg-white/50 dark:bg-background/50 rounded-3xl border-4 border-dashed border-sand/20 dark:border-sand/10"><div className="h-20 w-20 bg-sand/10 rounded-full flex items-center justify-center mx-auto mb-6 text-sand"><Sparkles size={40} /></div><p className="text-forest dark:text-sage font-black text-xl">No events scheduled.</p><p className="text-slate-500 mt-2">Add a family milestone to get started.</p></div>}</div>}

      {(editing || creating) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><form onSubmit={save} className="w-full max-w-lg space-y-5 rounded-3xl bg-surface p-8 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black text-forest dark:text-sage">{editing ? 'Edit Event' : 'Add Event'}</h2><button type="button" onClick={() => { setEditing(null); setCreating(false) }}><X /></button></div><select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} className="w-full rounded-xl border border-sand/30 bg-background p-3"><option value="gathering">Gathering</option><option value="birthday">Birthday</option><option value="anniversary">Anniversary</option><option value="memorial">Memorial</option></select><input required type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className="w-full rounded-xl border border-sand/30 bg-background p-3" /><select value={form.person_id} onChange={e => setForm({ ...form, person_id: e.target.value, marriage_id: '' })} className="w-full rounded-xl border border-sand/30 bg-background p-3"><option value="">No person</option>{persons.map(person => <option key={person.id} value={person.id}>{person.first_name} {person.last_name || ''}</option>)}</select><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location" className="w-full rounded-xl border border-sand/30 bg-background p-3" /><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="min-h-24 w-full rounded-xl border border-sand/30 bg-background p-3" /><button disabled={isAdding} className="w-full rounded-xl bg-forest py-3 font-black text-cream disabled:opacity-50">{isAdding ? 'SAVING...' : 'SAVE EVENT'}</button></form></div>}
      {viewing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-3xl bg-surface p-8 shadow-2xl"><div className="flex justify-between"><h2 className="text-2xl font-black text-forest dark:text-sage">Event Details</h2><button type="button" onClick={() => setViewing(null)}><X /></button></div><p className="mt-6 text-lg font-bold">{viewing.description || viewing.event_type}</p><p className="mt-2 text-sm text-slate-500">{formatDateDMY(viewing.event_date)}</p>{viewing.location && <p className="mt-2 text-sm text-slate-500">{viewing.location}</p>}</div></div>}
    </div>
  )
}
