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
  writeBatch,
  arrayUnion // Import arrayUnion for updating arrays
} from "firebase/firestore";

import AddRelationship from './AddRelationship';

function PersonsList({ user, connections }) {
  const [allPersons, setAllPersons] = useState([]);
  const [userPerson, setUserPerson] = useState(null);
  
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [personToAddTo, setPersonToAddTo] = useState(null);

  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingPersonData, setEditingPersonData] = useState({});

  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setAllPersons([]);
      return;
    }

    const connectedUids = [
      user.uid, 
      ...(connections || []).map(c => c.requesterUid === user.uid ? c.recipientUid : c.requesterUid)
    ];

    if (connectedUids.length === 0) {
        return;
    }

    const q = query(collection(db, "persons"), where("creatorUid", "in", connectedUids));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const personsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPersons(personsData);

      const self = personsData.find(p => p.claimedByUid === user.uid);
      setUserPerson(self);
    }, (err) => {
      console.error("Error fetching persons:", err);
      setError("Could not load family list.");
    });

    return () => unsubscribe();
  }, [user, connections]);

  
  const handleSaveRelationship = async (existingPersonId, relationshipType, newPersonData) => {
    setError('');
    try {
      const batch = writeBatch(db);
      const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPersonRef = doc(collection(db, "persons"));

      batch.set(newPersonRef, {
        ...newPersonData,
        creatorUid: user.uid,
        claimedByUid: null,
        invitationCode: invitationCode,
        parents: [],
        children: [],
        spouse: null,
      });

      const existingPersonRef = doc(db, "persons", existingPersonId);

      // FIX: Use arrayUnion to add to the array instead of replacing it
      if (relationshipType === "father" || relationshipType === "mother") {
        batch.update(existingPersonRef, { parents: arrayUnion(newPersonRef.id) });
        batch.update(newPersonRef, { children: arrayUnion(existingPersonId) });
      } else if (relationshipType === "child") {
        batch.update(existingPersonRef, { children: arrayUnion(newPersonRef.id) });
        batch.update(newPersonRef, { parents: arrayUnion(existingPersonId) });
      } else if (relationshipType === "spouse") {
        batch.update(existingPersonRef, { spouse: newPersonRef.id });
        batch.update(newPersonRef, { spouse: existingPersonId });
      }

      await batch.commit();
      setIsAddingRelationship(false);

    } catch (err) {
      console.error("Error creating relationship:", err);
      setError("Failed to create relationship.");
    }
  };

  const handleDeletePerson = async (personId) => {
    if (window.confirm("Are you sure?")) {
      try { await deleteDoc(doc(db, "persons", personId)); } 
      catch (err) { setError("Failed to delete person."); }
    }
  };

  const handleUpdatePerson = async (personId) => {
    try {
      await updateDoc(doc(db, "persons", personId), editingPersonData);
      setEditingPersonId(null);
    } catch (err) { setError("Failed to update person."); }
  };

  const startEditing = (person) => {
    setEditingPersonId(person.id);
    setEditingPersonData({
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      birthDate: person.birthDate || ''
    });
  };

  const handleFormChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prevState => ({ ...prevState, [name]: value }));
  };

  const openAddRelationshipModal = (person) => {
    setPersonToAddTo(person);
    setIsAddingRelationship(true);
  };

  // UPGRADED: This function is now smarter and can find in-laws.
  const getRelationshipToUser = (person) => {
    if (!userPerson || person.id === userPerson.id) {
      return null; // No relationship to self
    }
    // Check for direct relationships first
    if (userPerson.parents && userPerson.parents.includes(person.id)) {
      return person.gender === 'Male' ? '(Father)' : '(Mother)';
    }
    if (userPerson.children && userPerson.children.includes(person.id)) {
      return person.gender === 'Male' ? '(Son)' : '(Daughter)';
    }
    if (userPerson.spouse && userPerson.spouse === person.id) {
      return '(Spouse)';
    }

    // NEW: Check for relationships through the spouse (in-laws)
    if (userPerson.spouse) {
      const spousePerson = allPersons.find(p => p.id === userPerson.spouse);
      if (spousePerson) {
        // Check if the person is a parent of the spouse
        if (spousePerson.parents && spousePerson.parents.includes(person.id)) {
          return person.gender === 'Male' ? '(Father-in-law)' : '(Mother-in-law)';
        }
        // Check if the person is a child of the spouse
        if (spousePerson.children && spousePerson.children.includes(person.id)) {
          return person.gender === 'Male' ? '(Son)' : '(Daughter)';
        }
      }
    }
    
    return null; // No direct or in-law relationship found
  };

  return (
    <>
      {isAddingRelationship && (
        <AddRelationship 
          existingPerson={personToAddTo}
          onSave={handleSaveRelationship}
          onClose={() => setIsAddingRelationship(false)}
        />
      )}

      <div className="card">
        <h2>Combined Family List</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="persons-list">
          {allPersons.map(person => (
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
                   <input type="date" name="birthDate" value={editingPersonData.birthDate} onChange={(e) => handleFormChange(e, setEditingPersonData)} className="auth-input" />
                   <div className="edit-actions">
                      <button onClick={() => handleUpdatePerson(person.id)} className="action-button save">Save</button>
                      <button onClick={() => setEditingPersonId(null)} className="action-button cancel">Cancel</button>
                   </div>
                </div>
              ) : (
                <div className="display-view">
                  <div>
                    <p className="person-name">
                      {person.firstName} {person.lastName}
                      {person.id === userPerson?.id ? 
                        <strong> (You)</strong> : 
                        <span className="relationship-tag">{getRelationshipToUser(person)}</span>
                      }
                    </p>
                    {person.birthDate && <p className="person-detail">Born: {person.birthDate}</p>}
                    {!person.claimedByUid && person.invitationCode && (
                      <p className="invitation-code">
                        Invite Code: <strong>{person.invitationCode}</strong>
                      </p>
                    )}
                  </div>
                  <div className="person-actions">
                    <button onClick={() => openAddRelationshipModal(person)} className="action-button add-relative">Add Relative</button>
                    
                    {(person.creatorUid === user.uid || person.claimedByUid === user.uid) && (
                      <button onClick={() => startEditing(person)} className="action-button edit">Edit</button>
                    )}

                    {person.creatorUid === user.uid && (
                      <button onClick={() => handleDeletePerson(person.id)} className="action-button delete">Delete</button>
                    )}
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
