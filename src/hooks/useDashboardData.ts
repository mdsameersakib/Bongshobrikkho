import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

export function useDashboardStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { count: personsCount } = await supabase
        .from('persons')
        .select('*', { count: 'exact', head: true })

      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })

      const { count: connectionsCount } = await supabase
        .from('network_connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', new Date().toISOString().split('T')[0])

      return {
        persons: personsCount || 0,
        posts: postsCount || 0,
        pendingConnections: connectionsCount || 0,
        upcomingEvents: eventsCount || 0,
      }
    },
  })
}
