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

export function useComments(postId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles(email)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useWallMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const uploadImage = async (file: Blob | File) => {
    const fileExt = 'jpg' // We compress to jpeg in our utility
    const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`
    const filePath = `posts/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('family-wall')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('family-wall')
      .getPublicUrl(filePath)

    return publicUrl
  }

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

      const { data: existing, error: readError } = await supabase
        .from('reactions')
        .select('id, reaction_type')
        .eq('post_id', post_id)
        .eq('user_uid', user.id)
        .maybeSingle()
      if (readError) throw readError
      const { error } = existing?.reaction_type === type
        ? await supabase.from('reactions').delete().eq('id', existing.id)
        : await supabase.from('reactions').upsert({ post_id, user_uid: user.id, reaction_type: type }, { onConflict: 'post_id,user_uid' })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  })

  const addComment = useMutation({
    mutationFn: async ({ post_id, content }: { post_id: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('comments').insert({ post_id, content, author_uid: user.id })
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.post_id] })
    },
  })

  const updatePost = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase.from('posts').update({ content }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })

  const deleteComment = useMutation({
    mutationFn: async ({ id, post_id }: { id: string; post_id: string }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id)
      if (error) throw error
      return post_id
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['comments', variables.post_id] }),
  })

  return {
    createPost: createPost.mutateAsync,
    uploadImage,
    addReaction: addReaction.mutateAsync,
    addComment: addComment.mutateAsync,
    updatePost: updatePost.mutateAsync,
    deletePost: deletePost.mutateAsync,
    deleteComment: deleteComment.mutateAsync,
    isPosting: createPost.isPending || addComment.isPending || updatePost.isPending || deletePost.isPending || deleteComment.isPending
  }
}
