import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  or
} from "firebase/firestore";

// Import all our components
import Notifications from './Notifications';
import FamilyWall from './FamilyWall';
import UserSearch from './UserSearch';
import PersonsList from './PersonsList';

function Dashboard({ user, handleLogout }) {
  // State for Connections
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  
  // State for the combined family list now lives here
  const [allPersons, setAllPersons] = useState([]);

  const [error, setError] = useState('');

  // Listener for Connections
  useEffect(() => {
    if (!user) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setConnections([]);
      return;
    }
    const q = query(collection(db, "connections"), or(
      where("requesterUid", "==", user.uid),
      where("recipientUid", "==", user.uid)
    ));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incoming = [], outgoing = [], connected = [];
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.status === 'pending') {
          if (data.recipientUid === user.uid) incoming.push(data);
          else outgoing.push(data);
        } else if (data.status === 'accepted') {
          connected.push(data);
        }
      });
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setConnections(connected);
    });
    return () => unsubscribe();
  }, [user]);

  // The logic for fetching the family list is now here
  useEffect(() => {
    if (!user) {
      setAllPersons([]);
      return;
    }
    const connectedUids = [
      user.uid, 
      ...(connections || []).map(c => c.requesterUid === user.uid ? c.recipientUid : c.requesterUid)
    ];
    if (connectedUids.length === 0) return;

    const q = query(collection(db, "persons"), where("creatorUid", "in", connectedUids));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const personsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPersons(personsData);
    }, (err) => {
        console.error("Error fetching persons in Dashboard:", err);
        setError("Could not load family data.");
    });
    return () => unsubscribe();
  }, [user, connections]);


  // Connection Management Functions
  const handleAcceptRequest = async (connectionId) => {
    const connectionRef = doc(db, "connections", connectionId);
    try {
      await updateDoc(connectionRef, { status: 'accepted' });
    } catch (err) {
      setError("Failed to accept request.");
    }
  };
  const handleDeclineRequest = async (connectionId) => {
    const connectionRef = doc(db, "connections", connectionId);
    try {
      await deleteDoc(connectionRef);
    } catch (err) {
      setError("Failed to decline request.");
    }
  };

  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <p>Welcome, {user.email}!</p>
        <button onClick={handleLogout} className="auth-button logout">Logout</button>
      </div>
      
      {error && <p className="error-message">{error}</p>}

      {/* Render the new Notifications component */}
      <Notifications allPersons={allPersons} />

      {incomingRequests.length > 0 && (
        <div className="card">
          <h2>Connection Requests</h2>
          <div className="requests-list">
            {incomingRequests.map(req => (
              <div key={req.id} className="person-item">
                <div className="display-view">
                  <p>Request from: <strong>{req.requesterEmail}</strong></p>
                  <div className="person-actions">
                    <button onClick={() => handleAcceptRequest(req.id)} className="action-button save">Accept</button>
                    <button onClick={() => handleDeclineRequest(req.id)} className="action-button delete">Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render the other components, passing down the necessary data */}
      <FamilyWall user={user} connections={connections} />
      <UserSearch user={user} outgoingRequests={outgoingRequests} connections={connections} />
      {/* We now pass the family list down to PersonsList */}
      <PersonsList user={user} connections={connections} allPersons={allPersons} />
    </div>
  );
}

export default Dashboard;
