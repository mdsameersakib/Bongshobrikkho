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
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      return {
        persons: personsCount || 0,
        posts: postsCount || 0,
        pendingConnections: connectionsCount || 0,
        upcomingEvents: 0, // Placeholder
      }
    },
  })
}
