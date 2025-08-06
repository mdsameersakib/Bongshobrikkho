import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function useEvents(user, connections) {
  const [customEvents, setCustomEvents] = useState([]);

  useEffect(() => {
    if (!user) {
      setCustomEvents([]);
      return;
    }

    const networkUids = [
      user.uid,
      ...connections.map(c => c.requesterUid === user.uid ? c.recipientUid : c.requesterUid)
    ];

    if (networkUids.length === 0) return;

    const eventsQuery = query(
      collection(db, "events"),
      where("creatorUid", "in", networkUids),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomEvents(eventsData);
    });

    return () => unsubscribe();
  }, [user, connections]);

  return { customEvents };
}