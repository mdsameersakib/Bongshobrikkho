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

// Import the components we created
import FamilyWall from './FamilyWall';
import UserSearch from './UserSearch';
import PersonsList from './PersonsList';

// This component receives the current user and the logout function as props
function Dashboard({ user, handleLogout }) {
  // --- State for Connections ---
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState('');

  // --- Listener for all connection-related data ---
  useEffect(() => {
    if (!user) {
      // Clear all connection data if user logs out
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setConnections([]);
      return;
    }

    // This single query gets all documents where the user is involved
    const q = query(collection(db, "connections"), or(
      where("requesterUid", "==", user.uid),
      where("recipientUid", "==", user.uid)
    ));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incoming = [];
      const outgoing = [];
      const connected = [];

      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.status === 'pending') {
          if (data.recipientUid === user.uid) {
            incoming.push(data);
          } else {
            outgoing.push(data);
          }
        } else if (data.status === 'accepted') {
          connected.push(data);
        }
      });

      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setConnections(connected);
    });

    // Cleanup the listener
    return () => unsubscribe();
  }, [user]); // Rerun when user logs in

  // --- Connection Management Functions ---
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

      {/* --- Connection Requests Card --- */}
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
      {/* THIS IS THE FIX: We now pass the 'connections' state down to PersonsList */}
      <PersonsList user={user} connections={connections} />
    </div>
  );
}

export default Dashboard;
