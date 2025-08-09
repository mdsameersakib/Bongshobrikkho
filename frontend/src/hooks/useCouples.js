import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

// Stream all couples. Caller can filter against persons collection.
export default function useCouples() {
  const [couples, setCouples] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'couples'),
      snap => setCouples(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => { console.error('Failed to load couples:', err); setError('Failed to load couples'); }
    );
    return () => unsub();
  }, []);

  return { couples, error };
}
