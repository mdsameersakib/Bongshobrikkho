import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useComments from '../hooks/useComments';
import usePersons from '../hooks/usePersons';
import { getDisplayName } from '../utils/displayName';

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const comments = useComments(postId);
  const { allPersons } = usePersons();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, `posts/${postId}/comments`), {
        content: newComment.trim(),
        authorUid: user.uid,
        authorEmail: user.email,
        authorName: getDisplayName(user.uid, user.email, allPersons),
        createdAt: Timestamp.now(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment: ', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
      {comments.map(comment => {
        const name = comment.authorName || getDisplayName(comment.authorUid, comment.authorEmail, allPersons) || 'Unknown';
        const initial = name.charAt(0).toUpperCase();
        return (
          <div key={comment.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full accent-surface flex items-center justify-center text-[11px] font-semibold text-black dark:text-white border border-black/5 dark:border-white/10">
              {initial}
            </div>
            <div className="accent-surface-soft border border-black/5 dark:border-white/10 rounded-lg p-3 flex-1">
              <p className="font-semibold text-sm text-black dark:text-white leading-snug mb-0.5 break-words">{name}</p>
              <p className="text-sm text-black dark:text-white/90 whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          </div>
        );
      })}

      {comments.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">No comments yet. Be the first to comment.</p>
      )}

      {user && (
        <form onSubmit={handleAddComment} className="flex items-start gap-3 pt-2">
          <div className="w-8 h-8 rounded-full accent-surface flex items-center justify-center text-[11px] font-semibold text-black dark:text-white border border-black/5 dark:border-white/10">
            {(getDisplayName(user.uid, user.email, allPersons)[0] || 'U').toUpperCase()}
          </div>
            <div className="flex-1">
              <div className="accent-surface-soft rounded-full border border-transparent focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-[--accent] transition">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-transparent rounded-full py-2 px-4 text-sm text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none"
                  disabled={submitting}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="btn-primary ml-2 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
        </form>
      )}
    </div>
  );
}