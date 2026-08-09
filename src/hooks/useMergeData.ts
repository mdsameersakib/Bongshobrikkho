import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { Tables } from '@/types/database'

export type MergeConflict = Tables<'merge_conflicts'>

export function useMergeMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const createSession = useMutation({
    mutationFn: async ({ target_uid, conflicts }: { target_uid: string; conflicts: Array<Pick<MergeConflict, 'node_a_id' | 'node_b_id'>> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: session, error: sessionError } = await supabase.from('tree_merge_sessions').insert({ initiator_uid: user.id, target_uid }).select().single()
      if (sessionError) throw sessionError
      if (!conflicts.length) return { session, conflicts: [] as MergeConflict[] }
      const { data, error } = await supabase.from('merge_conflicts').insert(conflicts.map(conflict => ({ ...conflict, session_id: session.id, resolution_status: 'keep_both_as_separate' }))).select()
      if (error) throw error
      return { session, conflicts: data as MergeConflict[] }
    },
  })

  const updateConflict = useMutation({
    mutationFn: async ({ id, resolution_status, resolved_data }: { id: string; resolution_status: string; resolved_data?: Record<string, unknown> }) => {
      const { error } = await supabase.from('merge_conflicts').update({ resolution_status, resolved_data: resolved_data || null }).eq('id', id)
      if (error) throw error
    },
  })

  const executeMerge = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc('execute_tree_merge', { p_session_id: sessionId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['marriages'] })
      queryClient.invalidateQueries({ queryKey: ['parent_child'] })
    },
  })

  return { createSession: createSession.mutateAsync, updateConflict: updateConflict.mutateAsync, executeMerge: executeMerge.mutateAsync, isPending: createSession.isPending || updateConflict.isPending || executeMerge.isPending }
}
