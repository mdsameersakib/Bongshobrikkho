import React, { useState } from 'react';
import { db, auth } from '../services/firebase';
import { collection, addDoc, Timestamp, doc, updateDoc, deleteField } from 'firebase/firestore';

import useConnections from '../hooks/useConnections';
import useFamilyWall from '../hooks/useFamilyWall';
import CommentSection from '../components/CommentSection';

export default function FamilyWallPage() {
  const [user] = useState(auth.currentUser);
  const { accepted: connections } = useConnections(user);
  const { posts, error: postsError } = useFamilyWall(user, connections);

  const [newPostContent, setNewPostContent] = useState('');
  const [localError, setLocalError] = useState('');

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    try {
      await addDoc(collection(db, "posts"), {
        content: newPostContent,
        authorUid: user.uid,
        authorEmail: user.email,
        createdAt: Timestamp.now(),
        reactions: {}, // Initialize with an empty reactions map
      });
      setNewPostContent('');
    } catch (err) { setLocalError("Failed to create post."); }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    const userReactionKey = `reactions.${user.uid}`;
    
    const currentPost = posts.find(p => p.id === postId);
    const currentUserReaction = currentPost?.reactions?.[user.uid];

    try {
      if (currentUserReaction === reactionType) {
        await updateDoc(postRef, { [userReactionKey]: deleteField() });
      } else {
        await updateDoc(postRef, { [userReactionKey]: reactionType });
      }
    } catch (error) {
      console.error("Error updating reaction: ", error);
    }
  };
  
  const getReactionCount = (reactions, type) => {
    if (!reactions) return 0;
    return Object.values(reactions).filter(r => r === type).length;
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Family Wall</h2>
        <p className="text-gray-500 mt-1">See what everyone in the family is up to.</p>
      </header>
      
      {(postsError || localError) && <p className="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg">{postsError || localError}</p>}
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-4 rounded-xl shadow-md mb-8">
          <div className="flex items-start space-x-4">
            <img src={`https://placehold.co/40x40/2c7a7b/ffffff?text=${user?.email?.[0].toUpperCase()}`} alt="User Avatar" className="h-10 w-10 rounded-full" />
            <textarea
              className="w-full border-none p-2 text-gray-700 focus:ring-0 placeholder-gray-400"
              rows="3"
              placeholder={`What's on your mind, ${user?.email.split('@')[0]}?`}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={handleCreatePost} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">
              Post
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {posts.map(post => {
            const reactions = post.reactions || {};
            const currentUserReaction = reactions[user.uid];
            const likeCount = getReactionCount(reactions, 'like');
            const loveCount = getReactionCount(reactions, 'love');
            const hahaCount = getReactionCount(reactions, 'haha');

            return (
              <div key={post.id} className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <img src={`https://placehold.co/48x48/16a34a/ffffff?text=${post.authorEmail[0].toUpperCase()}`} alt={post.authorEmail} className="h-12 w-12 rounded-full object-cover" />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">{post.authorEmail}</p>
                    <p className="text-xs text-gray-500">
                      {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                
                <div className="flex items-center space-x-4 border-t pt-2">
                  <button onClick={() => handleReaction(post.id, 'like')} className={`reaction-btn text-sm flex items-center space-x-2 transition-colors ${currentUserReaction === 'like' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600'}`}>
                    <i className="far fa-thumbs-up"></i> 
                    <span>Like {likeCount > 0 && `(${likeCount})`}</span>
                  </button>
                  <button onClick={() => handleReaction(post.id, 'love')} className={`reaction-btn text-sm flex items-center space-x-2 transition-colors ${currentUserReaction === 'love' ? 'text-red-500 font-bold' : 'text-gray-500 hover:text-red-500'}`}>
                    <i className="far fa-heart"></i> 
                    <span>Love {loveCount > 0 && `(${loveCount})`}</span>
                  </button>
                  <button onClick={() => handleReaction(post.id, 'haha')} className={`reaction-btn text-sm flex items-center space-x-2 transition-colors ${currentUserReaction === 'haha' ? 'text-yellow-500 font-bold' : 'text-gray-500 hover:text-yellow-500'}`}>
                    <i className="far fa-laugh-squint"></i> 
                    <span>Haha {hahaCount > 0 && `(${hahaCount})`}</span>
                  </button>
                </div>

                <CommentSection postId={post.id} />
              </div>
            );
          })}
          {posts.length === 0 && <p className="text-center text-gray-500">The wall is empty. Be the first to post!</p>}
        </div>
      </div>
    </>
  );
}