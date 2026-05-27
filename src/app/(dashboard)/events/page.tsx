'use client'

import React from 'react'
import { useEvents } from '@/hooks/useEventData'
import { Plus, Calendar, MapPin, Info, Gift, Heart, Music, type LucideIcon, Sparkles } from 'lucide-react'
import { formatDateDMY } from '@/utils/date'
import { cn } from '@/lib/utils'
import { FamilyEvent } from '@/types/database'

const EventCard = ({ event }: { event: FamilyEvent & { person?: { first_name: string, last_name: string | null } } }) => {
  const types: Record<string, { icon: LucideIcon, color: string }> = {
    birthday: { icon: Gift, color: 'bg-forest/10 text-forest' },
    anniversary: { icon: Heart, color: 'bg-red-50 text-red-500' },
    gathering: { icon: Music, color: 'bg-sage/10 text-forest' },
    default: { icon: Info, color: 'bg-sand/20 text-slate-600' },
  }

  const { icon: Icon, color } = types[event.event_type] || types.default

  return (
    <div className="bg-surface p-6 rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", color)}>
          <Icon size={28} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-background dark:bg-surface-alt px-3 py-1 rounded-full border border-sand/10">
          {event.event_type}
        </span>
      </div>

      <div className="space-y-4">
        <h4 className="font-black text-xl text-forest dark:text-sage leading-tight">
          {event.description || `${event.person?.first_name}'s Special Day`}
        </h4>
        
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
            <div className="h-8 w-8 rounded-lg bg-sand/10 flex items-center justify-center text-forest">
              <Calendar size={16} />
            </div>
            <span>{formatDateDMY(event.event_date)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
              <div className="h-8 w-8 rounded-lg bg-sand/10 flex items-center justify-center text-forest">
                <MapPin size={16} />
              </div>
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>
      
      <button className="mt-8 w-full py-3 bg-background dark:bg-background text-forest dark:text-sage font-black text-xs uppercase tracking-widest rounded-xl border border-sand/30 hover:bg-forest hover:text-cream transition-all">
        VIEW DETAILS
      </button>
    </div>
  )
}

export default function EventsPage() {
  const { data: events = [] } = useEvents()

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-forest dark:text-sage tracking-tight">Family Events</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Celebrate every milestone together.</p>
        </div>
        <button 
          className="bg-forest hover:bg-forest/90 text-cream px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-forest/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={20} />
          ADD EVENT
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white/50 dark:bg-background/50 rounded-3xl border-4 border-dashed border-sand/20 dark:border-sand/10">
            <div className="h-20 w-20 bg-sand/10 rounded-full flex items-center justify-center mx-auto mb-6 text-sand">
              <Sparkles size={40} />
            </div>
            <p className="text-forest dark:text-sage font-black text-xl">No events scheduled.</p>
            <p className="text-slate-500 mt-2">Start a new family tradition today!</p>
          </div>
        )}
      </div>
    </div>
  )
}
