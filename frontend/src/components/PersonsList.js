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
      } else if (relationshipType === "sibling") {
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

  const handleFormChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prevState => ({ ...prevState, [name]: value }));
  };

  const openAddRelationshipModal = (person) => {
    setPersonToAddTo(person);
    setIsAddingRelationship(true);
  };

  // --- FULLY UPGRADED getRelationshipToUser FUNCTION ---
  const getRelationshipToUser = (person) => {
    if (!userPerson || person.id === userPerson.id || !allPersons) return null;

    const myParents = userPerson.parents || [];
    const theirParents = person.parents || [];

    // 1. Direct relationships (most important)
    if (myParents.includes(person.id)) return person.gender === 'Male' ? '(Father)' : '(Mother)';
    if (userPerson.children?.includes(person.id)) return person.gender === 'Male' ? '(Son)' : '(Daughter)';
    if (userPerson.spouse === person.id) return person.gender === 'Male' ? '(Husband)' : '(Wife)';

    // 2. Sibling check
    if (myParents.length > 0 && theirParents.length > 0) {
        if (myParents.some(pId => theirParents.includes(pId))) {
            return person.gender === 'Male' ? '(Brother)' : '(Sister)';
        }
    }

    // 3. Grand-relations
    if (myParents.length > 0) {
        for (const parentId of myParents) {
            const parent = allPersons.find(p => p.id === parentId);
            if (parent?.parents?.includes(person.id)) {
                return person.gender === 'Male' ? '(Grandfather)' : '(Grandmother)';
            }
        }
    }
    if (userPerson.children?.length > 0) {
        for (const childId of userPerson.children) {
            if (theirParents.includes(childId)) {
                return person.gender === 'Male' ? '(Grandson)' : '(Granddaughter)';
            }
        }
    }

    // 4. In-Laws
    if (userPerson.spouse) {
        const spouse = allPersons.find(p => p.id === userPerson.spouse);
        if (spouse) {
            // Parent-in-law
            if (spouse.parents?.includes(person.id)) {
                return person.gender === 'Male' ? '(Father-in-law)' : '(Mother-in-law)';
            }
            // Sibling-in-law (Spouse's Sibling)
            if (spouse.parents?.length > 0 && theirParents.length > 0) {
                if (spouse.parents.some(pId => theirParents.includes(pId))) {
                    return person.gender === 'Male' ? '(Brother-in-law)' : '(Sister-in-law)';
                }
            }
        }
    }

    // 5. Aunts, Uncles, Nieces, Nephews, Cousins
    if (myParents.length > 0) {
        for (const parentId of myParents) {
            const myParent = allPersons.find(p => p.id === parentId);
            if (myParent) {
                // Uncle / Aunt (My Parent's Sibling)
                if (myParent.parents?.length > 0 && person.parents?.length > 0) {
                    if (myParent.parents.some(pId => person.parents.includes(pId))) {
                        return person.gender === 'Male' ? '(Uncle)' : '(Aunt)';
                    }
                }
                // Cousin (Child of my Parent's Sibling)
                if (person.parents?.length > 0) {
                   for (const theirParentId of person.parents) {
                       const theirParent = allPersons.find(p => p.id === theirParentId);
                       if (theirParent && myParent.parents?.some(pId => theirParent.parents?.includes(pId))) {
                           return '(Cousin)';
                       }
                   }
                }
            }
        }
    }
    
    // Niece / Nephew (My Sibling's Child)
    const mySiblings = allPersons.filter(p => p.id !== userPerson.id && p.parents?.length > 0 && myParents.some(pId => p.parents.includes(pId)));
    for (const sibling of mySiblings) {
        if (sibling.children?.includes(person.id)) {
            return person.gender === 'Male' ? '(Nephew)' : '(Niece)';
        }
    }

    return null; // No direct or extended relationship found
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