'use client'

import React from 'react'
import { useDashboardStats } from '@/hooks/useDashboardData'
import { usePersons } from '@/hooks/useFamilyData'
import { Users, Calendar, UserPlus, MessageSquare, ChevronRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { formatDateDMY } from '@/utils/date'

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: LucideIcon, color: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  }

  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", colors[color])}>
        <Icon size={24} />
      </div>
    </div>
  )
}

import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { data: stats } = useDashboardStats()
  const { data: persons = [] } = usePersons()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Welcome to your family overview.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Family Members" value={stats?.persons || 0} icon={Users} color="green" />
        <StatCard title="Upcoming Events" value={stats?.upcomingEvents || 0} icon={Calendar} color="blue" />
        <StatCard title="Pending Requests" value={stats?.pendingConnections || 0} icon={UserPlus} color="orange" />
        <StatCard title="Wall Posts" value={stats?.posts || 0} icon={MessageSquare} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Members */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Family Members Preview</h3>
            <Link href="/family-list" className="text-sm font-bold text-blue-600 hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {persons.slice(0, 5).map(person => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                    {person.first_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{person.first_name} {person.last_name}</p>
                    <p className="text-xs text-slate-500">Born: {formatDateDMY(person.birth_date)}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            ))}
            {persons.length === 0 && (
              <p className="text-center py-8 text-slate-500 text-sm italic">No family members found yet.</p>
            )}
          </div>
        </div>

        {/* Recent Activity / Next Event Placeholder */}
        <div className="space-y-6">
          <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-500/20">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar size={20} /> Next Event
            </h3>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Coming Soon</p>
              <p className="text-lg font-bold mt-1">Birthday Celebration</p>
              <p className="text-sm mt-1 opacity-90">Stay tuned for updates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
