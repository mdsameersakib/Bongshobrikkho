'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { usePosts, useWallMutations, useComments } from '@/hooks/useWallData'
import { ThumbsUp, Heart, Camera, Send, MoreHorizontal, MessageSquare, Newspaper, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Comment, Post, Profile, Reaction } from '@/types/database'
import { compressImage } from '@/utils/image'
import { QueryError } from '@/components/QueryState'
import { createClient } from '@/lib/supabase-client'

function WallPost({ post, userId, onError }: { post: Post & { author?: Profile; reactions: Reaction[] }; userId: string | null; onError: (message: string) => void }) {
  const { data: comments = [], error: commentsError } = useComments(post.id)
  const { addReaction, addComment, updatePost, deletePost, deleteComment } = useWallMutations()
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(post.content || '')

  const run = async (action: () => Promise<unknown>) => {
    try { await action() } catch (error) { onError(error instanceof Error ? error.message : 'Unable to update this post.') }
  }

  return (
    <div className="bg-surface rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 flex items-center justify-between border-b border-sand/5"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-sage/20 text-forest flex items-center justify-center font-black text-lg border-2 border-sage/10">{post.author?.email?.[0].toUpperCase() || 'U'}</div><div><h4 className="text-base font-black text-forest dark:text-sage">{post.author?.email?.split('@')[0] || 'User'}</h4><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5">{post.created_at ? `${formatDistanceToNow(new Date(post.created_at))} ago` : 'Just now'}</p></div></div>{post.author_uid === userId && <div className="flex gap-2"><button type="button" onClick={() => setEditing(!editing)} title="Edit post" className="text-slate-400 hover:text-forest"><MoreHorizontal size={20} /></button><button type="button" onClick={() => run(() => deletePost(post.id))} title="Delete post" className="text-slate-400 hover:text-red-500"><X size={20} /></button></div>}</div>
      <div className="px-6 py-6">{editing ? <div className="space-y-3"><textarea value={content} onChange={e => setContent(e.target.value)} className="min-h-24 w-full rounded-xl border border-sand/30 bg-background p-3" /><button type="button" onClick={() => run(async () => { await updatePost({ id: post.id, content }); setEditing(false) })} className="rounded-xl bg-forest px-4 py-2 text-xs font-black text-cream">SAVE</button></div> : <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>}{post.image_url && <div className="relative mt-6 w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl"><Image src={post.image_url} alt="Post" fill className="object-cover" /></div>}</div>
      <div className="px-6 py-4 bg-background/30 border-t border-sand/10"><div className="flex items-center gap-2 sm:gap-6"><button type="button" onClick={() => run(() => addReaction({ post_id: post.id, type: 'like' }))} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase", post.reactions?.some(r => r.reaction_type === 'like' && r.user_uid === userId) ? 'bg-forest text-cream' : 'text-slate-500 hover:text-forest')}><ThumbsUp size={16} />{post.reactions?.filter(r => r.reaction_type === 'like').length || 0}</button><button type="button" onClick={() => run(() => addReaction({ post_id: post.id, type: 'love' }))} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase", post.reactions?.some(r => r.reaction_type === 'love' && r.user_uid === userId) ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-red-500')}><Heart size={16} />{post.reactions?.filter(r => r.reaction_type === 'love').length || 0}</button></div><div className="mt-4 space-y-2">{commentsError ? <QueryError error={commentsError} /> : comments.map((item: Comment & { author?: Profile }) => <div key={item.id} className="flex justify-between rounded-xl bg-surface p-3 text-sm"><span><b>{item.author?.email?.split('@')[0] || 'User'}:</b> {item.content}</span>{item.author_uid === userId && <button type="button" onClick={() => run(() => deleteComment({ id: item.id, post_id: post.id }))} className="text-red-400"><X size={14} /></button>}</div>)}<form onSubmit={e => { e.preventDefault(); if (comment.trim()) run(async () => { await addComment({ post_id: post.id, content: comment.trim() }); setComment('') }) }} className="flex gap-2"><input value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-xl border border-sand/20 bg-surface px-3 py-2 text-sm" /><button className="rounded-xl bg-forest px-3 text-cream"><MessageSquare size={16} /></button></form></div></div>
    </div>
  )
}

export default function FamilyWallPage() {
  const { data: posts = [], isLoading, error: postsError } = usePosts()
  const { createPost, uploadImage, isPosting } = useWallMutations()
  const [userId, setUserId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id || null)) }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !selectedFile) return
    
    setIsUploading(true)
    try {
      let image_url = undefined
      
      if (selectedFile) {
        // Optimize image before upload to save egress/storage
        const optimizedBlob = await compressImage(selectedFile, { maxWidth: 1200, quality: 0.8 })
        image_url = await uploadImage(optimizedBlob)
      }

      await createPost({ content, image_url })
      
      // Cleanup
      setContent('')
      removeSelectedFile()
    } catch (error) {
      console.error('Failed to post:', error)
      setError(error instanceof Error ? error.message : 'Failed to share post. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="text-center">
        <h1 className="text-4xl font-black text-forest dark:text-sage tracking-tight">Family Wall</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Share updates and memories with your loved ones.</p>
      </header>
      {error && <QueryError error={new Error(error)} />}

      {/* Create Post */}
      <div className="bg-surface p-6 rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl space-y-4 focus-within:ring-4 focus-within:ring-forest/5 transition-all">
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-full bg-forest text-cream flex items-center justify-center font-black flex-shrink-0">{userId ? 'Y' : 'U'}</div>
          <div className="flex-1 space-y-4">
            <textarea 
              placeholder="What's happening in your branch of the tree?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-base min-h-[100px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            
            {previewUrl && (
              <div className="relative w-fit group">
                <div className="relative h-40 w-40 rounded-2xl overflow-hidden border-4 border-sand/20 shadow-md">
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                </div>
                <button 
                  type="button"
                  onClick={removeSelectedFile}
                  className="absolute -top-2 -right-2 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-sand/10 dark:border-sand/5">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-forest dark:text-sage hover:bg-forest/5 dark:hover:bg-sage/10 px-4 py-2 rounded-xl transition-all text-sm font-black uppercase tracking-widest"
          >
            <Camera size={20} />
            {selectedFile ? 'Change Photo' : 'Add Photo'}
          </button>
          <button 
            onClick={handlePost}
            type="button"
            disabled={isPosting || isUploading || (!content.trim() && !selectedFile)}
            className="bg-forest hover:bg-forest/90 disabled:opacity-50 text-cream px-8 py-2.5 rounded-xl text-sm font-black shadow-xl shadow-forest/20 transition-all flex items-center gap-2 active:scale-95"
          >
            {(isPosting || isUploading) ? (
              <>
                <div className="h-4 w-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                POSTING...
              </>
            ) : (
              <>
                <Send size={18} />
                POST
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-8">
        {postsError ? <QueryError error={postsError} /> : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-12 w-12 border-4 border-sand/30 border-t-forest rounded-full animate-spin" />
            <p className="text-forest font-black uppercase tracking-widest text-xs">Growing your wall...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white/50 dark:bg-background/50 rounded-3xl border-4 border-dashed border-sand/20 dark:border-sand/10 animate-in fade-in duration-300">
            <div className="h-20 w-20 bg-sand/10 rounded-full flex items-center justify-center mx-auto mb-6 text-sand">
              <Newspaper size={40} />
            </div>
            <p className="text-forest dark:text-sage font-black text-xl">The wall is empty.</p>
            <p className="text-slate-500 mt-2 font-bold">Be the first to share a family memory!</p>
          </div>
        ) : (
          posts.map(post => <WallPost key={post.id} post={post} userId={userId} onError={message => setError(message)} />)
        )}
      </div>
    </div>
  )
}
