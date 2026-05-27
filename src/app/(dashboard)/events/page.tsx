'use client'

import React from 'react'
import { useEvents } from '@/hooks/useEventData'
import { Plus, Calendar, MapPin, Info, Gift, Heart, Music, type LucideIcon } from 'lucide-react'
import { formatDateDMY } from '@/utils/date'
import { cn } from '@/lib/utils'
import { FamilyEvent } from '@/types/database'

const EventCard = ({ event }: { event: FamilyEvent & { person?: { first_name: string, last_name: string | null } } }) => {
  const types: Record<string, { icon: LucideIcon, color: string }> = {
    birthday: { icon: Gift, color: 'bg-blue-100 text-blue-600' },
    anniversary: { icon: Heart, color: 'bg-pink-100 text-pink-600' },
    gathering: { icon: Music, color: 'bg-green-100 text-green-600' },
    default: { icon: Info, color: 'bg-slate-100 text-slate-600' },
  }

  const { icon: Icon, color } = types[event.event_type] || types.default

  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", color)}>
          <Icon size={24} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{event.event_type}</span>
      </div>

      <div>
        <h4 className="font-bold text-lg">{event.description || `${event.person?.first_name}'s Event`}</h4>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
          <Calendar size={14} />
          <span>{formatDateDMY(event.event_date)}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EventsPage() {
  const { data: events = [] } = useEvents()

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Family Events</h1>
          <p className="text-slate-500 dark:text-slate-400">Never miss a family milestone.</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Add Event
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <p className="text-slate-500">No events scheduled. Start by adding one!</p>
          </div>
        )}
      </div>
    </div>
  )
}
