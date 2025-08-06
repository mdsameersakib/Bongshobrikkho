import { useState } from 'react';
import { db } from '../services/firebase';
import {
  collection, doc, writeBatch, arrayUnion, deleteDoc, updateDoc,
  query, where, getDocs, Timestamp, addDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useConnections from './useConnections';
import usePersons from './usePersons';

export default function useFamilyList() {
  const { user } = useAuth();  
  const { accepted: connections, outgoing: outgoingRequests } = useConnections();
  const { allPersons, userPerson, error: dataError } = usePersons();
   
  // --- STATE MANAGEMENT ---
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personToModify, setPersonToModify] = useState(null);
  const [localError, setLocalError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');
  
  // --- LOGIC (HANDLER FUNCTIONS) ---
  const handleSaveRelationship = async (existingPersonId, relationshipType, newPersonData) => {
    setLocalError('');
    try {
      const batch = writeBatch(db);
      const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPersonRef = doc(collection(db, "persons"));
      const baseNewPerson = { ...newPersonData, creatorUid: user.uid, claimedByUid: null, invitationCode, parents: [], children: [], spouse: null };
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
        batch.update(existingPersonRef, { spouse: newPersonRef.id });
      } else if (relationshipType === "sibling") {
        if (!existingPerson?.parents || existingPerson.parents.length === 0) { setLocalError("Cannot add a sibling to someone with no parents."); return; }
        batch.set(newPersonRef, { ...baseNewPerson, parents: existingPerson.parents });
        existingPerson.parents.forEach(parentId => {
          const parentRef = doc(db, "persons", parentId);
          batch.update(parentRef, { children: arrayUnion(newPersonRef.id) });
        });
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
  
  // --- FULLY UPGRADED relationship detection logic as requested ---
  const getRelationshipToUser = (person) => {
    if (!userPerson || person.id === userPerson.id) return "You";

    const myParents = userPerson.parents || [];
    const theirParents = person.parents || [];

    if (myParents.includes(person.id)) return person.gender === 'Male' ? 'Father' : 'Mother';
    if (userPerson.children?.includes(person.id)) return person.gender === 'Male' ? 'Son' : 'Daughter';
    if (userPerson.spouse === person.id || person.spouse === userPerson.id) return person.gender === 'Male' ? 'Husband' : 'Wife';
    if (myParents.length > 0 && theirParents.length > 0 && myParents.some(pId => theirParents.includes(pId))) {
        return person.gender === 'Male' ? 'Brother' : 'Sister';
    }
    if (myParents.length > 0) {
        for (const parentId of myParents) {
            const parent = allPersons.find(p => p.id === parentId);
            if (parent?.parents?.includes(person.id)) {
                return person.gender === 'Male' ? 'Grandfather' : 'Grandmother';
            }
        }
    }
    if (userPerson.children?.length > 0) {
        for (const childId of userPerson.children) {
            if (theirParents.includes(childId)) {
                return person.gender === 'Male' ? 'Grandson' : 'Granddaughter';
            }
        }
    }
    if (userPerson.spouse) {
        const spouse = allPersons.find(p => p.id === userPerson.spouse);
        if (spouse) {
            if (spouse.parents?.includes(person.id)) return person.gender === 'Male' ? 'Father-in-law' : 'Mother-in-law';
            if (spouse.parents?.length > 0 && theirParents.length > 0 && spouse.parents.some(pId => theirParents.includes(pId))) {
                return person.gender === 'Male' ? 'Brother-in-law' : 'Sister-in-law';
            }
        }
    }
    if (myParents.length > 0) {
        for (const parentId of myParents) {
            const myParent = allPersons.find(p => p.id === parentId);
            if (myParent) {
                if (myParent.parents?.length > 0 && person.parents?.length > 0 && myParent.parents.some(pId => person.parents.includes(pId))) {
                    return person.gender === 'Male' ? 'Uncle' : 'Aunt';
                }
                if (person.parents?.length > 0) {
                   for (const theirParentId of person.parents) {
                       const theirParent = allPersons.find(p => p.id === theirParentId);
                       if (theirParent && myParent.parents?.some(pId => theirParent.parents?.includes(pId))) {
                           return 'Cousin';
                       }
                   }
                }
            }
        }
    }
    const mySiblings = allPersons.filter(p => p.id !== userPerson.id && p.parents?.length > 0 && myParents.some(pId => p.parents.includes(pId)));
    for (const sibling of mySiblings) {
        if (sibling.children?.includes(person.id)) {
            return person.gender === 'Male' ? 'Nephew' : 'Niece';
        }
    }

    return "Relative";
  };
  
  return {
    user, allPersons, userPerson, error: dataError || localError,
    connections, outgoingRequests,
    isAdding, setIsAdding, isEditing, setIsEditing, personToModify,
    searchQuery, setSearchQuery, searchResults, searchMessage,
    handleSaveRelationship, handleDeletePerson, handleUpdatePerson,
    openAddModal, openEditModal, getRelationshipToUser,
    handleUserSearch, handleSendRequest, getConnectionStatus
  };
}