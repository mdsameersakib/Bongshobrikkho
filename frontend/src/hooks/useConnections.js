import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  or,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function useConnections() {
  const { user } = useAuth();

  const [connectionsData, setConnectionsData] = useState({
    accepted: [],
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setConnectionsData({ accepted: [], incoming: [], outgoing: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'connections'),
      or(
        where('requesterUid', '==', user.uid),
        where('recipientUid', '==', user.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accepted = [];
      const incoming = [];
      const outgoing = [];

      snapshot.forEach((doc) => {
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const acceptRequest = async (connectionId) => {
    setError('');
    try {
      const connectionRef = doc(db, 'connections', connectionId);
      await updateDoc(connectionRef, { status: 'accepted' });
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request.');
    }
  };

  const declineRequest = async (connectionId) => {
    setError('');
    try {
      const connectionRef = doc(db, 'connections', connectionId);
      await deleteDoc(connectionRef);
    } catch (err) {
      console.error('Error declining request:', err);
      setError('Failed to decline request.');
    }
  };

  return { ...connectionsData, loading, error, acceptRequest, declineRequest };
}