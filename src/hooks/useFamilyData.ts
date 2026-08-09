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
        .select(`
          *,
          profiles:profiles!profiles_person_id_fkey(id)
        `)
      
      if (error) throw error
      
      // Map data to include a simplified joined flag
      return (data as (Person & { profiles: { id: string }[] })[]).map(p => ({
        ...p,
        is_user: p.profiles && p.profiles.length > 0
      })) as (Person & { is_user: boolean })[]
    },
  })
}

export function useMarriages() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['marriages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marriages')
        .select('*')
      
      if (error) throw error
      return data
    },
  })
}

export function useParentChild() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['parent_child'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_child')
        .select('*')
      
      if (error) throw error
      return data
    },
  })
}

export function useProfile() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
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
        .rpc('lookup_profile_by_email', { p_email: email.trim() })
      
      if (error) throw error
      return data
    },
  })
}
