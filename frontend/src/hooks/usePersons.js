import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';

export default function usePersons(user, connections) {
  const [allPersons, setAllPersons] = useState([]);
  const [userPerson, setUserPerson] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setAllPersons([]);
      return;
    };
    
    const networkUids = [
      user.uid,
      ...connections.map(c => c.requesterUid === user.uid ? c.recipientUid : c.requesterUid)
    ];

    if (networkUids.length === 0) return;

    const q = query(
        collection(db, "persons"),
        or(
            where("claimedByUid", "in", networkUids),
            where("creatorUid", "in", networkUids)
        )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const personsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPersons(personsData);
      const self = personsData.find(p => p.claimedByUid === user.uid);
      setUserPerson(self);
    }, (err) => {
      setError("Failed to load family members.");
      console.error(err);
    });

    return () => unsubscribe();
  }, [user, connections]);

  return { allPersons, userPerson, error };
}