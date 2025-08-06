import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';

export default function useConnections(user) {
  // The state will now hold an object with different categories of connections
  const [connectionsData, setConnectionsData] = useState({
    accepted: [],
    incoming: [],
    outgoing: [],
  });

  useEffect(() => {
    if (!user) {
      setConnectionsData({ accepted: [], incoming: [], outgoing: [] });
      return;
    };

    const q = query(collection(db, "connections"), or(where("requesterUid", "==", user.uid), where("recipientUid", "==", user.uid)));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accepted = [];
      const incoming = [];
      const outgoing = [];

      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.status === 'accepted') {
          accepted.push(data);
        } else if (data.status === 'pending') {
          if (data.recipientUid === user.uid) {
            incoming.push(data);
          } else {
            outgoing.push(data);
          }
        }
      });
      
      setConnectionsData({ accepted, incoming, outgoing });
    });

    return () => unsubscribe();
  }, [user]);

  return connectionsData;
}