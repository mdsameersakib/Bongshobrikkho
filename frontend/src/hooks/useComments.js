import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function useComments(postId) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!postId) return;

    const commentsQuery = query(
      collection(db, `posts/${postId}/comments`),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);

  return comments;
}