import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

// This component receives the current user object as a "prop"
function PersonsList({ user }) {
  // --- State for Firestore Data ---
  const [persons, setPersons] = useState([]);
  const [newPerson, setNewPerson] = useState({ firstName: '', lastName: '', gender: 'Male' });
  
  // --- State for Editing ---
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingPersonData, setEditingPersonData] = useState({});

  const [error, setError] = useState('');

  // --- Firestore Real-time Data Listener ---
  useEffect(() => {
    // This check is important. If there's no user, we don't fetch data.
    if (!user) {
      setPersons([]);
      return;
    }

    // Create a query to get persons created by the current user
    const q = query(collection(db, "persons"), where("creatorUid", "==", user.uid));

    // onSnapshot listens for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const personsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPersons(personsData);
    });

    // Cleanup subscription on component unmount or user change
    return () => unsubscribe();
  }, [user]); // Rerun this effect when the user prop changes

  // --- Firestore CRUD Functions ---
  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!newPerson.firstName) {
      setError("First name is required.");
      return;
    }
    setError('');
    try {
      await addDoc(collection(db, "persons"), { ...newPerson, creatorUid: user.uid });
      setNewPerson({ firstName: '', lastName: '', gender: 'Male' });
    } catch (err) {
      setError("Failed to add person.");
    }
  };

  const handleDeletePerson = async (personId) => {
    if (window.confirm("Are you sure?")) {
      try {
        await deleteDoc(doc(db, "persons", personId));
      } catch (err) {
        setError("Failed to delete person.");
      }
    }
  };

  const handleUpdatePerson = async (personId) => {
    try {
      await updateDoc(doc(db, "persons", personId), editingPersonData);
      setEditingPersonId(null); // Exit editing mode
    } catch (err) {
      setError("Failed to update person.");
    }
  };

  // --- Helper functions for forms ---
  const startEditing = (person) => {
    setEditingPersonId(person.id);
    setEditingPersonData({ ...person });
  };

  const handleFormChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prevState => ({ ...prevState, [name]: value }));
  };

  return (
    <>
      <div className="card">
        <h2>Add a New Person</h2>
        <form onSubmit={handleAddPerson} className="person-form">
          <input name="firstName" value={newPerson.firstName} onChange={(e) => handleFormChange(e, setNewPerson)} placeholder="First Name" className="auth-input" />
          <input name="lastName" value={newPerson.lastName} onChange={(e) => handleFormChange(e, setNewPerson)} placeholder="Last Name" className="auth-input" />
          <select name="gender" value={newPerson.gender} onChange={(e) => handleFormChange(e, setNewPerson)} className="auth-input">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <button type="submit" className="auth-button">Save Person</button>
        </form>
      </div>

      <div className="card">
        <h2>Your Family Members</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="persons-list">
          {persons.map(person => (
            <div key={person.id} className="person-item">
              {editingPersonId === person.id ? (
                <div className="edit-form">
                   <input name="firstName" value={editingPersonData.firstName} onChange={(e) => handleFormChange(e, setEditingPersonData)} className="auth-input" />
                   <input name="lastName" value={editingPersonData.lastName} onChange={(e) => handleFormChange(e, setEditingPersonData)} className="auth-input" />
                   <select name="gender" value={editingPersonData.gender} onChange={(e) => handleFormChange(e, setEditingPersonData)} className="auth-input">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                   </select>
                   <div className="edit-actions">
                      <button onClick={() => handleUpdatePerson(person.id)} className="action-button save">Save</button>
                      <button onClick={() => setEditingPersonId(null)} className="action-button cancel">Cancel</button>
                   </div>
                </div>
              ) : (
                <div className="display-view">
                  <p>{person.firstName} {person.lastName} ({person.gender})</p>
                  <div className="person-actions">
                    <button onClick={() => startEditing(person)} className="action-button edit">Edit</button>
                    <button onClick={() => handleDeletePerson(person.id)} className="action-button delete">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default PersonsList;
