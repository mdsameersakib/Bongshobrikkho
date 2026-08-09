'use client'

import React from 'react'
import { useDashboardStats } from '@/hooks/useDashboardData'
import { usePersons } from '@/hooks/useFamilyData'
import { Users, Calendar, UserPlus, MessageSquare, ChevronRight, Network, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { formatDateDMY } from '@/utils/date'
import { cn } from '@/lib/utils'
import { QueryError } from '@/components/QueryState'

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: LucideIcon, color: 'forest' | 'sage' | 'sand' | 'cream' }) => {
  const colors = {
    forest: 'bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest',
    sage: 'bg-sage/10 text-sage dark:bg-sage/20 dark:text-sage',
    sand: 'bg-sand/20 text-slate-700 dark:bg-sand/30 dark:text-sand',
    cream: 'bg-background text-forest border border-sand/30',
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-sand/20 dark:border-sand/10 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl transition-colors duration-300 group-hover:scale-110", colors[color])}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-black text-forest dark:text-sage">{value}</h3>
        </div>
      </div>
      <ChevronRight className="text-slate-300 group-hover:text-forest dark:group-hover:text-sage transition-colors" size={20} />
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, error: statsError } = useDashboardStats()
  const { data: persons = [], error: personsError } = usePersons()
  
  const latestMembers = [...persons]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-10">
      {(statsError || personsError) && <QueryError error={statsError || personsError} />}
      <header>
        <h1 className="text-4xl font-black text-forest dark:text-sage tracking-tight">Family Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Your family&apos;s growth and activity at a glance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={stats?.persons || 0} icon={Users} color="forest" />
        <StatCard title="Upcoming Events" value={stats?.upcomingEvents || 0} icon={Calendar} color="sage" />
        <StatCard title="New Requests" value={stats?.pendingConnections || 0} icon={UserPlus} color="sand" />
        <StatCard title="Wall Posts" value={stats?.posts || 0} icon={MessageSquare} color="forest" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-sand/20 dark:border-sand/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-sand/10 dark:border-sand/5 flex justify-between items-center">
            <h2 className="text-xl font-black text-forest dark:text-sage">Recent Additions</h2>
            <Link href="/family-list" className="text-sm font-bold text-sage hover:text-forest transition-colors flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-sand/10 dark:divide-sand/5">
            {latestMembers.length > 0 ? (
              latestMembers.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-background/30 dark:hover:bg-background/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-forest text-cream flex items-center justify-center font-bold text-lg shadow-inner">
                      {member.first_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{member.first_name} {member.last_name}</p>
                      <p className="text-xs text-slate-500">Added on {formatDateDMY(member.created_at)}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                    member.gender === 'male' 
                      ? 'bg-forest/10 text-forest border border-forest/20 dark:bg-forest/20' 
                      : 'bg-sage/10 text-forest dark:text-sage border border-sage/20 dark:bg-sage/20'
                  )}>
                    {member.gender}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <p className="text-slate-500">No members added yet.</p>
                <Link href="/family-tree" className="mt-4 inline-block bg-forest text-cream px-6 py-2 rounded-xl font-bold shadow-md hover:scale-105 transition-transform">
                  Start Building Your Tree
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips/Stats */}
        <div className="space-y-6">
          <div className="bg-forest text-cream p-8 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
              <Network size={120} />
            </div>
            <h3 className="text-2xl font-black mb-2 relative z-10">Pro Tip</h3>
            <p className="text-cream/80 text-sm leading-relaxed relative z-10">
              Add placeholder profiles for deceased relatives to complete your lineage and preserve family history for future generations.
            </p>
            <Link href="/family-tree" className="mt-6 inline-block bg-background text-forest px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:bg-sage hover:text-cream transition-colors relative z-10">VIEW TREE</Link>
          </div>

          <div className="bg-sand/10 dark:bg-surface p-6 rounded-2xl border-2 border-dashed border-sand/40 dark:border-sand/10 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-sand/20 rounded-full flex items-center justify-center text-forest mb-4">
              <UserPlus size={32} />
            </div>
            <h4 className="font-black text-forest dark:text-sage uppercase tracking-wider text-sm">Expand Your Reach</h4>
            <p className="text-xs text-slate-500 mt-2">Invite siblings or cousins to collaborate on your family tree.</p>
            <Link href="/family-list" className="mt-4 block w-full py-2 text-center border-2 border-forest dark:border-sage text-forest dark:text-sage font-black rounded-xl hover:bg-forest dark:hover:bg-sage hover:text-cream transition-all text-xs">FIND FAMILY</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
