import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { 
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  arrayUnion,
  collection
} from "firebase/firestore";

import AddRelationship from './AddRelationship';

// This component is now much simpler. It receives all the data it needs as props.
function PersonsList({ user, connections, allPersons }) {
  const [userPerson, setUserPerson] = useState(null);
  
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [personToAddTo, setPersonToAddTo] = useState(null);

  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingPersonData, setEditingPersonData] = useState({});

  const [error, setError] = useState('');

  // This small useEffect just finds the user's own profile from the list.
  useEffect(() => {
    if (user && allPersons) {
      const self = allPersons.find(p => p.claimedByUid === user.uid);
      setUserPerson(self);
    }
  }, [user, allPersons]);


  // All the functions for saving, deleting, and updating remain here.
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
      const existingPerson = allPersons.find(p => p.id === existingPersonId);

      if (relationshipType === "child") {
        batch.update(existingPersonRef, { children: arrayUnion(newPersonRef.id) });
        batch.update(newPersonRef, { parents: arrayUnion(existingPersonId) });

        if (existingPerson && existingPerson.spouse) {
          const spouseRef = doc(db, "persons", existingPerson.spouse);
          batch.update(newPersonRef, { parents: arrayUnion(existingPerson.spouse) });
          batch.update(spouseRef, { children: arrayUnion(newPersonRef.id) });
        }
      } else if (relationshipType === "father" || relationshipType === "mother") {
        batch.update(existingPersonRef, { parents: arrayUnion(newPersonRef.id) });
        batch.update(newPersonRef, { children: arrayUnion(existingPersonId) });
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

  const getRelationshipToUser = (person) => {
    if (!userPerson || person.id === userPerson.id) return null;
    if (userPerson.parents?.includes(person.id)) return person.gender === 'Male' ? '(Father)' : '(Mother)';
    if (userPerson.children?.includes(person.id)) return person.gender === 'Male' ? '(Son)' : '(Daughter)';
    if (userPerson.spouse === person.id) return '(Spouse)';

    if (userPerson.spouse) {
      const spousePerson = allPersons.find(p => p.id === userPerson.spouse);
      if (spousePerson) {
        if (spousePerson.parents?.includes(person.id)) return person.gender === 'Male' ? '(Father-in-law)' : '(Mother-in-law)';
      }
    }
    return null;
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
          {allPersons && allPersons.map(person => (
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
                    <button onClick={() => startEditing(person)} className="action-button edit">Edit</button>
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
