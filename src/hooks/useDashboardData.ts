import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

export function useDashboardStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { count: personsCount, error: personsError } = await supabase
        .from('persons')
        .select('*', { count: 'exact', head: true })
      if (personsError) throw personsError

      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
      if (postsError) throw postsError

      const { count: connectionsCount, error: connectionsError } = await supabase
        .from('network_connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (connectionsError) throw connectionsError

      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', new Date().toISOString().split('T')[0])
      if (eventsError) throw eventsError

      return {
        persons: personsCount || 0,
        posts: postsCount || 0,
        pendingConnections: connectionsCount || 0,
        upcomingEvents: eventsCount || 0,
      }
    },
  })
}
