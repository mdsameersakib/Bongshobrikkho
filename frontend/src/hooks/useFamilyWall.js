import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useConnections from './useConnections'; // <-- Import useConnections

export default function useFamilyWall() { // <-- connections removed
  const { user } = useAuth();
  const { accepted: connections } = useConnections(); // <-- Get connections inside
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