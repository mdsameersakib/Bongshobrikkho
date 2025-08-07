import { useState, useCallback } from 'react';
import { db, auth } from '../services/firebase';
import {
  collection, doc, writeBatch, arrayUnion, deleteDoc, updateDoc,
  query, where, getDocs, Timestamp, addDoc
} from 'firebase/firestore';

import useConnections from './useConnections';
import usePersons from './usePersons';

export default function useFamilyList() {
  const [user] = useState(auth.currentUser);
  const { accepted: connections, outgoing: outgoingRequests } = useConnections();
  const { allPersons, userPerson, error: dataError } = usePersons();
  
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personToModify, setPersonToModify] = useState(null);
  const [localError, setLocalError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');

  const handleSaveRelationship = async (existingPersonId, relationshipType, newPersonData) => {
    setLocalError('');
    try {
      const batch = writeBatch(db);
      const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPersonRef = doc(collection(db, "persons"));
      const baseNewPerson = { ...newPersonData, creatorUid: user.uid, claimedByUid: null, invitationCode, fatherId: null, motherId: null, children: [], spouse: null };
      const existingPersonRef = doc(db, "persons", existingPersonId);
      const existingPerson = allPersons.find(p => p.id === existingPersonId);

      if (relationshipType === "child") {
        const childUpdate = {};
        if (existingPerson.gender === 'Male') {
          childUpdate.fatherId = existingPersonId;
        } else if (existingPerson.gender === 'Female') {
          childUpdate.motherId = existingPersonId;
        }
        batch.set(newPersonRef, { ...baseNewPerson, ...childUpdate });
        batch.update(existingPersonRef, { children: arrayUnion(newPersonRef.id) });
        
        if (existingPerson?.spouse) {
          const spouse = allPersons.find(p => p.id === existingPerson.spouse);
          if (spouse) {
            const spouseUpdate = {};
            if (spouse.gender === 'Male') {
              spouseUpdate.fatherId = existingPerson.spouse;
            } else if (spouse.gender === 'Female') {
              spouseUpdate.motherId = existingPerson.spouse;
            }
            batch.update(newPersonRef, spouseUpdate);
            batch.update(doc(db, "persons", existingPerson.spouse), { children: arrayUnion(newPersonRef.id) });
          }
        }
      } else if (relationshipType === "father" || relationshipType === "mother") {
        if ((relationshipType === 'father' && existingPerson.fatherId) || (relationshipType === 'mother' && existingPerson.motherId)) {
            setLocalError(`This person already has a ${relationshipType}.`);
            return;
        }
        
        const parentUpdate = {};
        if (newPersonData.gender === 'Male') {
            if (existingPerson.fatherId) { setLocalError("This person already has a father."); return; }
            parentUpdate.fatherId = newPersonRef.id;
        } else { // Female
            if (existingPerson.motherId) { setLocalError("This person already has a mother."); return; }
            parentUpdate.motherId = newPersonRef.id;
        }

        batch.set(newPersonRef, { ...baseNewPerson, children: arrayUnion(existingPersonId) });
        batch.update(existingPersonRef, parentUpdate);

        const otherParentId = newPersonData.gender === 'Male' ? existingPerson.motherId : existingPerson.fatherId;
        if (otherParentId) {
            const otherParentRef = doc(db, "persons", otherParentId);
            batch.update(newPersonRef, { spouse: otherParentId });
            batch.update(otherParentRef, { spouse: newPersonRef.id });
        }
      } else if (relationshipType === "spouse") {
        batch.set(newPersonRef, { ...baseNewPerson, spouse: existingPersonId });
        batch.update(existingPersonRef, { spouse: newPersonRef.id });
      } else if (relationshipType === "sibling") {
        if (!existingPerson?.fatherId && !existingPerson?.motherId) {
          setLocalError("Cannot add a sibling to someone with no parents."); return;
        }
        const siblingUpdate = {
            fatherId: existingPerson.fatherId || null,
            motherId: existingPerson.motherId || null,
        };
        batch.set(newPersonRef, { ...baseNewPerson, ...siblingUpdate });
        
        if (existingPerson.fatherId) batch.update(doc(db, "persons", existingPerson.fatherId), { children: arrayUnion(newPersonRef.id) });
        if (existingPerson.motherId) batch.update(doc(db, "persons", existingPerson.motherId), { children: arrayUnion(newPersonRef.id) });
      }
      await batch.commit();
      setIsAdding(false);
    } catch (err) { console.error(err); setLocalError("Failed to create relationship."); }
  };
  
  const handleDeletePerson = async (personId) => {
    if (window.confirm("Are you sure?")) {
      try { await deleteDoc(doc(db, "persons", personId)); } 
      catch (err) { setLocalError("Failed to delete person."); }
    }
  };

  const handleUpdatePerson = async (personId, updatedData) => {
    try {
      await updateDoc(doc(db, "persons", personId), updatedData);
      setIsEditing(false);
    } catch (err) { setLocalError("Failed to update person."); }
  };

  const openAddModal = (person) => { setIsAdding(true); setPersonToModify(person); };
  const openEditModal = (person) => { setIsEditing(true); setPersonToModify(person); };
  
  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearchMessage('Searching...');
    setSearchResults([]);
    setLocalError('');
    try {
      const q = query(collection(db, "users"), where("email", "==", searchQuery));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => doc.data()).filter(foundUser => foundUser.uid !== user.uid);
      setSearchResults(results);
      setSearchMessage(results.length === 0 ? 'No users found.' : '');
    } catch (err) { setLocalError('An error occurred during search.'); }
  };

  const handleSendRequest = async (recipient) => {
    try {
      await addDoc(collection(db, "connections"), {
        requesterUid: user.uid, requesterEmail: user.email,
        recipientUid: recipient.uid, recipientEmail: recipient.email,
        status: 'pending', createdAt: Timestamp.now(),
      });
      alert("Request Sent!");
      setSearchResults([]); setSearchQuery(''); setSearchMessage('');
    } catch (err) { setLocalError("Failed to send request."); }
  };

  const getConnectionStatus = (targetUid) => {
    if (outgoingRequests.some(req => req.recipientUid === targetUid)) return 'Pending';
    if (connections.some(con => con.requesterUid === targetUid || con.recipientUid === targetUid)) return 'Connected';
    return 'None';
  };
  
  const getRelationshipToUser = useCallback((person) => {
    if (!userPerson || person.id === userPerson.id) return "You";

    const myFatherId = userPerson.fatherId;
    const myMotherId = userPerson.motherId;

    if (myFatherId === person.id) return 'Father';
    if (myMotherId === person.id) return 'Mother';

    if (userPerson.children?.includes(person.id)) return person.gender === 'Male' ? 'Son' : 'Daughter';
    if (userPerson.spouse === person.id || person.spouse === userPerson.id) return person.gender === 'Male' ? 'Husband' : 'Wife';

    const hasSharedFather = myFatherId && myFatherId === person.fatherId;
    const hasSharedMother = myMotherId && myMotherId === person.motherId;
    if (hasSharedFather || hasSharedMother) {
        return person.gender === 'Male' ? 'Brother' : 'Sister';
    }
    
    // Grandparent check
    const myFather = allPersons.find(p => p.id === myFatherId);
    const myMother = allPersons.find(p => p.id === myMotherId);
    if (myFather?.fatherId === person.id || myFather?.motherId === person.id || myMother?.fatherId === person.id || myMother?.motherId === person.id) {
        return person.gender === 'Male' ? 'Grandfather' : 'Grandmother';
    }

    // Grandchild check
    if (userPerson.children?.includes(person.fatherId) || userPerson.children?.includes(person.motherId)) {
        return person.gender === 'Male' ? 'Grandson' : 'Granddaughter';
    }
    
    // In-law check
    if (userPerson.spouse) {
        const spouse = allPersons.find(p => p.id === userPerson.spouse);
        if (spouse) {
            if (spouse.fatherId === person.id || spouse.motherId === person.id) {
                return person.gender === 'Male' ? 'Father-in-law' : 'Mother-in-law';
            }
            const spouseHasSharedParent = (spouse.fatherId && spouse.fatherId === person.fatherId) || (spouse.motherId && spouse.motherId === person.motherId);
            if(spouseHasSharedParent) {
                return person.gender === 'Male' ? 'Brother-in-law' : 'Sister-in-law';
            }
        }
    }
    
    return "Relative";
  }, [userPerson, allPersons]);
  
  return {
    user, allPersons, userPerson, error: dataError || localError,
    connections, outgoingRequests,
    isAdding, setIsAdding, isEditing, setIsEditing, personToModify,
    searchQuery, setSearchQuery, searchResults, searchMessage,
    handleSaveRelationship, handleDeletePerson, handleUpdatePerson,
    openAddModal, openEditModal, getRelationshipToUser,
    handleUserSearch, handleSendRequest, getConnectionStatus
  }
}