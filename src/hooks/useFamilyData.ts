import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { Person } from '@/types/database'

export function usePersons() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['persons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
      
      if (error) throw error
      return data as Person[]
    },
  })
}

export function useCouples() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['couples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
      
      if (error) throw error
      return data
    },
  })
}

export function useLineage() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['lineage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lineage')
        .select('*')
      
      if (error) throw error
      return data
    },
  })
}

export function useProfileSearch() {
  const supabase = createClient()

  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
      
      if (error) throw error
      return data
    },
  })
}
