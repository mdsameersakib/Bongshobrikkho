import React, { useState } from 'react';
import { db } from '../services/firebase'; // <-- FIXED: 'auth' import removed
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; // <-- We now get the user from here
import useComments from '../hooks/useComments';

export default function CommentSection({ postId }) {
  const { user } = useAuth(); // Get user from the context
  const comments = useComments(postId);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await addDoc(collection(db, `posts/${postId}/comments`), {
        content: newComment,
        authorUid: user.uid,
        authorEmail: user.email,
        createdAt: Timestamp.now(),
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {/* List of existing comments */}
      {comments.map(comment => (
        <div key={comment.id} className="flex items-start space-x-3">
          <img src={`https://placehold.co/32x32/2c7a7b/ffffff?text=${comment.authorEmail[0].toUpperCase()}`} alt={comment.authorEmail} className="h-8 w-8 rounded-full" />
          <div className="bg-gray-100 p-3 rounded-lg flex-1">
            <p className="font-semibold text-sm text-gray-800">{comment.authorEmail}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          </div>
        </div>
      ))}

      {/* Add new comment form */}
      {user && (
        <form onSubmit={handleAddComment} className="flex items-center space-x-3">
          <img src={`https://placehold.co/32x32/2c7a7b/ffffff?text=${user.email[0].toUpperCase()}`} alt="User Avatar" className="h-8 w-8 rounded-full" />
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..." 
            className="w-full bg-gray-100 border-none rounded-full py-2 px-4 focus:ring-2 focus:ring-teal-500"
          />
        </form>
      )}
    </div>
  );
}