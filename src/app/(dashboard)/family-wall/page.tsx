'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { usePosts, useWallMutations } from '@/hooks/useWallData'
import { ThumbsUp, Heart, Camera, Send, MoreHorizontal, MessageSquare, Newspaper } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Reaction } from '@/types/database'

export default function FamilyWallPage() {
  const { data: posts = [], isLoading } = usePosts()
  const { createPost, addReaction, isPosting } = useWallMutations()
  const [content, setContent] = useState('')

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    await createPost({ content })
    setContent('')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="text-center">
        <h1 className="text-4xl font-black text-forest dark:text-sage tracking-tight">Family Wall</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Share updates and memories with your loved ones.</p>
      </header>

      {/* Create Post */}
      <div className="bg-surface p-6 rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl space-y-4 focus-within:ring-4 focus-within:ring-forest/5 transition-all">
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-2xl bg-forest text-cream flex items-center justify-center font-black flex-shrink-0">
            U
          </div>
          <textarea 
            placeholder="What's happening in your branch of the tree?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 resize-none text-base min-h-[100px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-sand/10 dark:border-sand/5">
          <button className="flex items-center gap-2 text-forest dark:text-sage hover:bg-forest/5 dark:hover:bg-sage/10 px-4 py-2 rounded-xl transition-all text-sm font-black uppercase tracking-widest">
            <Camera size={20} />
            Add Photo
          </button>
          <button 
            onClick={handlePost}
            disabled={isPosting || !content.trim()}
            className="bg-forest hover:bg-forest/90 disabled:opacity-50 text-cream px-8 py-2.5 rounded-xl text-sm font-black shadow-xl shadow-forest/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Send size={18} />
            POST
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-8">
        {isLoading ? (
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
          posts.map(post => (
            <div key={post.id} className="bg-surface rounded-3xl border border-sand/20 dark:border-sand/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Post Header */}
              <div className="p-6 flex items-center justify-between border-b border-sand/5 dark:border-sand/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-sage/20 text-forest flex items-center justify-center font-black text-lg border-2 border-sage/10">
                    {post.author?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-forest dark:text-sage leading-none">
                      {post.author?.email?.split('@')[0] || 'User'}
                    </h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
                      {post.created_at ? `${formatDistanceToNow(new Date(post.created_at))} ago` : 'Just now'}
                    </p>
                  </div>
                </div>
                <button className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-forest transition-colors rounded-xl hover:bg-forest/5">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Post Content */}
              <div className="px-6 py-6">
                <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
                {post.image_url && (
                  <div className="relative mt-6 w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                    <Image 
                      src={post.image_url} 
                      alt="Post" 
                      fill
                      className="object-cover" 
                    />
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="px-6 py-4 bg-background/30 dark:bg-background/30 border-t border-sand/10 dark:border-sand/5 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-6">
                  <button 
                    onClick={() => addReaction({ post_id: post.id, type: 'like' })}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest",
                      post.reactions?.some((r: Reaction) => r.reaction_type === 'like') 
                        ? "bg-forest text-cream shadow-lg" 
                        : "text-slate-500 hover:bg-forest/5 hover:text-forest"
                    )}
                  >
                    <ThumbsUp size={16} />
                    <span>{post.reactions?.filter((r: Reaction) => r.reaction_type === 'like').length || 0}</span>
                  </button>
                  <button 
                    onClick={() => addReaction({ post_id: post.id, type: 'love' })}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest",
                      post.reactions?.some((r: Reaction) => r.reaction_type === 'love') 
                        ? "bg-red-500 text-white shadow-lg" 
                        : "text-slate-500 hover:bg-red-50 hover:text-red-500"
                    )}
                  >
                    <Heart size={16} />
                    <span>{post.reactions?.filter((r: Reaction) => r.reaction_type === 'love').length || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-forest/5 hover:text-forest transition-all text-xs font-black uppercase tracking-widest">
                    <MessageSquare size={16} />
                    <span>Comment</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
