import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { FamilyEvent } from '@/types/database'

export function useEvents() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, person:persons(first_name, last_name)')
        .order('event_date', { ascending: true })
      
      if (error) throw error
      return data
    },
  })
}

export function useEventMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const addEvent = useMutation({
    mutationFn: async (data: Omit<FamilyEvent, 'id' | 'created_at'>) => {
      const { data: event, error } = await supabase
        .from('events')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      return event
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  const updateEvent = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<FamilyEvent, 'id' | 'created_at'>> }) => {
      const { error } = await supabase.from('events').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  return {
    addEvent: addEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
    isAdding: addEvent.isPending || updateEvent.isPending || deleteEvent.isPending
  }
}
