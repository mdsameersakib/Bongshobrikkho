import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useConnections from './useConnections';

export default function useFamilyWall() {
  const { user } = useAuth();
  const { accepted: connections } = useConnections();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      return;
    }

    const networkUids = [
      user.uid,
      ...connections.map((c) =>
        c.requesterUid === user.uid ? c.recipientUid : c.requesterUid
      ),
    ];

    if (networkUids.length === 0) return;

    const postsQuery = query(
      collection(db, 'posts'),
      where('authorUid', 'in', networkUids),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      },
      (err) => {
        setError('Failed to load wall posts.');
        console.error(err);
      }
    );

    return () => unsubscribe();
  }, [user, connections]);

  const createPost = async (content) => {
    if (!content.trim() || !user) return;
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'posts'), {
        content: content,
        authorUid: user.uid,
        authorEmail: user.email,
        createdAt: Timestamp.now(),
        reactions: {},
      });
    } catch (err) {
      setError('Failed to create post.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    const userReactionKey = `reactions.${user.uid}`;

    const currentPost = posts.find((p) => p.id === postId);
    const currentUserReaction = currentPost?.reactions?.[user.uid];

    try {
      if (currentUserReaction === reactionType) {
        await updateDoc(postRef, { [userReactionKey]: deleteField() });
      } else {
        await updateDoc(postRef, { [userReactionKey]: reactionType });
      }
    } catch (error) {
      setError('Error updating reaction.');
      console.error('Error updating reaction: ', error);
    }
  };

  return { posts, error, loading, createPost, handleReaction };
}