import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth

export default function useConnections() { // 2. Remove user from arguments
  const { user } = useAuth(); // 3. Get user from the context
  
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