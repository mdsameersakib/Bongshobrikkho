import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { Post, Reaction, Profile } from '@/types/database'

export function usePosts() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles(*), reactions(*)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as (Post & { author: Profile, reactions: Reaction[] })[]
    },
  })
}

export function useWallMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const createPost = useMutation({
    mutationFn: async ({ content, image_url }: { content: string, image_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('posts')
        .insert({
          content,
          image_url,
          author_uid: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  })

  const addReaction = useMutation({
    mutationFn: async ({ post_id, type }: { post_id: string, type: 'like' | 'love' | 'haha' }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('reactions')
        .upsert({
          post_id,
          user_uid: user.id,
          reaction_type: type
        }, { onConflict: 'post_id,user_uid' })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  })

  return {
    createPost: createPost.mutateAsync,
    addReaction: addReaction.mutateAsync,
    isPosting: createPost.isPending
  }
}
