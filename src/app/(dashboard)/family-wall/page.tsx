'use client'

import React, { useState } from 'react'
import { usePosts, useWallMutations } from '@/hooks/useWallData'
import { usePersons } from '@/hooks/useFamilyData'
import { ThumbsUp, Heart, Laugh, Camera, Send, MoreHorizontal, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

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
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Family Wall</h1>
        <p className="text-slate-500 dark:text-slate-400">Share updates and memories with the family.</p>
      </header>

      {/* Create Post */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <textarea 
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm min-h-[80px]"
        />
        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900">
          <button className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
            <Camera size={18} />
            Add Photo
          </button>
          <button 
            onClick={handlePost}
            disabled={isPosting || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Send size={16} />
            Post
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading your wall...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <p className="text-slate-500">The wall is empty. Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                    {post.author?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{post.author?.display_name || post.author?.email}</h4>
                    <p className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(post.created_at))} ago</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-4">
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="mt-4 rounded-lg w-full object-cover max-h-96" />
                )}
              </div>

              {/* Post Actions */}
              <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => addReaction({ post_id: post.id, type: 'like' })}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-xs font-bold"
                  >
                    <ThumbsUp size={16} />
                    <span>Like {post.reactions?.filter(r => r.reaction_type === 'like').length || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors text-xs font-bold">
                    <Heart size={16} />
                    <span>Love {post.reactions?.filter(r => r.reaction_type === 'love').length || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors text-xs font-bold">
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
