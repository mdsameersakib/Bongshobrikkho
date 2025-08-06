import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function useFamilyWall(user, connections) {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setPosts([]);
      return;
    }

    const networkUids = [
      user.uid,
      ...connections.map(c => c.requesterUid === user.uid ? c.recipientUid : c.requesterUid)
    ];

    if (networkUids.length === 0) return;

    const postsQuery = query(
      collection(db, "posts"),
      where("authorUid", "in", networkUids),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    }, (err) => {
      setError("Failed to load wall posts.");
      console.error(err);
    });

    return () => unsubscribe();
  }, [user, connections]);

  return { posts, error };
}