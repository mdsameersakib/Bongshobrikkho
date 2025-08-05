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

function PersonsList({ user, connections, allPersons }) {
  const [userPerson, setUserPerson] = useState(null);
  
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [personToAddTo, setPersonToAddTo] = useState(null);

  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingPersonData, setEditingPersonData] = useState({});

  const [error, setError] = useState('');

  useEffect(() => {
    if (user && allPersons) {
      const self = allPersons.find(p => p.claimedByUid === user.uid);
      setUserPerson(self);
    }
  }, [user, allPersons]);

  const handleSaveRelationship = async (existingPersonId, relationshipType, newPersonData) => {
    setError('');
    try {
      const batch = writeBatch(db);
      const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPersonRef = doc(collection(db, "persons"));

      const baseNewPerson = {
        ...newPersonData,
        creatorUid: user.uid, claimedByUid: null, invitationCode: invitationCode,
        parents: [], children: [], spouse: null,
      };

      const existingPersonRef = doc(db, "persons", existingPersonId);
      const existingPerson = allPersons.find(p => p.id === existingPersonId);

      if (relationshipType === "child") {
        batch.set(newPersonRef, { ...baseNewPerson, parents: arrayUnion(existingPersonId) });
        batch.update(existingPersonRef, { children: arrayUnion(newPersonRef.id) });
        if (existingPerson?.spouse) {
          const spouseRef = doc(db, "persons", existingPerson.spouse);
          batch.update(newPersonRef, { parents: arrayUnion(existingPerson.spouse) });
          batch.update(spouseRef, { children: arrayUnion(newPersonRef.id) });
        }
      } else if (relationshipType === "father" || relationshipType === "mother") {
        batch.set(newPersonRef, { ...baseNewPerson, children: arrayUnion(existingPersonId) });
        batch.update(existingPersonRef, { parents: arrayUnion(newPersonRef.id) });
      } else if (relationshipType === "spouse") {
        batch.set(newPersonRef, { ...baseNewPerson, spouse: existingPersonId });
        batch.update(newPersonRef, { spouse: existingPersonId });
      } 
      else if (relationshipType === "sibling") {
        if (!existingPerson?.parents || existingPerson.parents.length === 0) {
            setError("Cannot add a sibling to someone with no parents.");
            return;
        }
        batch.set(newPersonRef, { ...baseNewPerson, parents: existingPerson.parents });
        existingPerson.parents.forEach(parentId => {
            const parentRef = doc(db, "persons", parentId);
            batch.update(parentRef, { children: arrayUnion(newPersonRef.id) });
        });
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

  // This function is now used by the edit form's "Save" button.
  const handleUpdatePerson = async (personId) => {
    try {
      await updateDoc(doc(db, "persons", personId), editingPersonData);
      setEditingPersonId(null);
    } catch (err) { setError("Failed to update person."); }
  };

  const startEditing = (person) => {
    setEditingPersonId(person.id);
    setEditingPersonData({
      firstName: person.firstName, lastName: person.lastName,
      gender: person.gender, birthDate: person.birthDate || ''
    });
  };

  // This function is now used by the edit form's input fields.
  const handleFormChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prevState => ({ ...prevState, [name]: value }));
  };

  const openAddRelationshipModal = (person) => {
    setPersonToAddTo(person);
    setIsAddingRelationship(true);
  };

  const getRelationshipToUser = (person) => {
    if (!userPerson || person.id === userPerson.id || !allPersons) return null;
    if (userPerson.parents?.includes(person.id)) return person.gender === 'Male' ? '(Father)' : '(Mother)';
    if (userPerson.children?.includes(person.id)) return person.gender === 'Male' ? '(Son)' : '(Daughter)';
    if (userPerson.spouse === person.id) return person.gender === 'Male' ? '(Husband)' : '(Wife)';
    if (userPerson.parents?.length > 0 && person.parents?.length > 0) {
        const hasSharedParent = userPerson.parents.some(pId => person.parents.includes(pId));
        if (hasSharedParent) return person.gender === 'Male' ? '(Brother)' : '(Sister)';
    }
    if (userPerson.parents?.length > 0) {
        for (const parentId of userPerson.parents) {
            const parent = allPersons.find(p => p.id === parentId);
            if (parent?.parents?.includes(person.id)) {
                return person.gender === 'Male' ? '(Grandfather)' : '(Grandmother)';
            }
        }
    }
    if (userPerson.children?.length > 0) {
        for (const childId of userPerson.children) {
            if (person.parents?.includes(childId)) {
                return person.gender === 'Male' ? '(Grandson)' : '(Granddaughter)';
            }
        }
    }
    if (userPerson.spouse) {
      const spousePerson = allPersons.find(p => p.id === userPerson.spouse);
      if (spousePerson?.parents?.includes(person.id)) {
        return person.gender === 'Male' ? '(Father-in-law)' : '(Mother-in-law)';
      }
    }
    return null;
  };

  return (
    <>
      {isAddingRelationship && (
        <AddRelationship 
          existingPerson={personToAddTo}
          allPersons={allPersons}
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
                // --- THIS IS THE RESTORED EDIT FORM CODE ---
                <div className="edit-form">
                   <input name="firstName" value={editingPersonData.firstName} onChange={(e) => handleFormChange(e, setEditingPersonData)} placeholder="First Name" className="auth-input" />
                   <input name="lastName" value={editingPersonData.lastName} onChange={(e) => handleFormChange(e, setEditingPersonData)} placeholder="Last Name" className="auth-input" />
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
                      <p className="invitation-code">Invite Code: <strong>{person.invitationCode}</strong></p>
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