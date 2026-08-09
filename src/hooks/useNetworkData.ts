import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { Tables } from '@/types/database'

export type Connection = Tables<'network_connections'>
export type PrivacySettings = Tables<'privacy_settings'>
export type ProfileLookup = Pick<Tables<'profiles'>, 'id' | 'email' | 'person_id'>

export function useConnections() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_connections')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Connection[]
    },
  })
}

export function usePrivacySettings() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['privacy-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_uid', user.id)
        .maybeSingle()
      if (error) throw error
      return data as PrivacySettings | null
    },
  })
}

export function useNetworkMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['connections'] })

  const requestConnection = useMutation({
    mutationFn: async (recipient_uid: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('network_connections')
        .insert({ requester_uid: user.id, recipient_uid, status: 'pending' })
        .select()
        .single()
      if (error) throw error
      return data as Connection
    },
    onSuccess: refresh,
  })

  const updateConnection = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase
        .from('network_connections')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: refresh,
  })

  const cancelConnection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('network_connections').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: refresh,
  })

  const updatePrivacy = useMutation({
    mutationFn: async (settings: Partial<Omit<PrivacySettings, 'id' | 'user_uid' | 'created_at' | 'updated_at'>>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('privacy_settings')
        .upsert({ user_uid: user.id, ...settings }, { onConflict: 'user_uid' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['privacy-settings'] }),
  })

  return {
    requestConnection: requestConnection.mutateAsync,
    updateConnection: updateConnection.mutateAsync,
    cancelConnection: cancelConnection.mutateAsync,
    updatePrivacy: updatePrivacy.mutateAsync,
    isPending: requestConnection.isPending || updateConnection.isPending || cancelConnection.isPending || updatePrivacy.isPending,
  }
}
