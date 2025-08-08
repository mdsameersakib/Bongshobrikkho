import { useState, useCallback } from 'react';
import { db } from '../services/firebase';
import {
  collection, doc, writeBatch, arrayUnion, arrayRemove, updateDoc, query, where, getDocs, Timestamp, addDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useConnections from './useConnections';
import usePersons from './usePersons';

export default function useFamilyList() {
  const { user } = useAuth();
  const { accepted: connections, outgoing: outgoingRequests } = useConnections();
  const { allPersons, userPerson, error: dataError } = usePersons();
  
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personToModify, setPersonToModify] = useState(null);
  const [addMode, setAddMode] = useState('child');
  const [localError, setLocalError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');

  const createNewPersonObject = (data) => ({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      gender: data.gender || 'Other',
      birthDate: data.birthDate || '',
      creatorUid: user.uid,
      claimedByUid: null,
      invitationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      parents: [],
      children: [],
      spouse: null,
  });

  const handleSaveCouple = async (person, type, formData) => {
    setLocalError('');
    try {
        if (!user) throw new Error("User not authenticated.");
        const batch = writeBatch(db);

        if (type === 'parents') {
            const fatherRef = doc(collection(db, "persons"));
            const motherRef = doc(collection(db, "persons"));
            const fatherData = createNewPersonObject({firstName: formData.fatherFirstName, lastName: formData.fatherLastName, gender: 'Male', birthDate: formData.fatherBirthDate});
            const motherData = createNewPersonObject({firstName: formData.motherFirstName, lastName: formData.motherLastName, gender: 'Female', birthDate: formData.motherBirthDate});
            
            fatherData.spouse = motherRef.id;
            fatherData.children = [person.id];
            motherData.spouse = fatherRef.id;
            motherData.children = [person.id];

            batch.set(fatherRef, fatherData);
            batch.set(motherRef, motherData);
            
            if (formData.marriageDate) {
                const coupleRef = doc(collection(db, "couples"));
                batch.set(coupleRef, { husbandId: fatherRef.id, wifeId: motherRef.id, marriageDate: formData.marriageDate, childrenIds: [person.id] });
            }
            batch.update(doc(db, "persons", person.id), { parents: [fatherRef.id, motherRef.id] });
        }

        if (type === 'spouse') {
            const newSpouseRef = doc(collection(db, "persons"));
            const existingPersonRef = doc(db, "persons", person.id);
            const newSpouseData = createNewPersonObject({firstName: formData.spouseFirstName, lastName: formData.spouseLastName, gender: formData.spouseGender, birthDate: formData.spouseBirthDate});
            newSpouseData.spouse = person.id;
            
            batch.set(newSpouseRef, newSpouseData);
            batch.update(existingPersonRef, { spouse: newSpouseRef.id });

            if (formData.marriageDate) {
                const coupleRef = doc(collection(db, "couples"));
                const childrenIds = person.children || [];
                const coupleData = person.gender === 'Male' 
                    ? { husbandId: person.id, wifeId: newSpouseRef.id, marriageDate: formData.marriageDate, childrenIds }
                    : { husbandId: newSpouseRef.id, wifeId: person.id, marriageDate: formData.marriageDate, childrenIds };
                batch.set(coupleRef, coupleData);
            }
        }
        await batch.commit();
        setIsAdding(false);
    } catch (err) {
        console.error("Error saving couple:", err);
        setLocalError("Failed to save couple.");
    }
  };
  
  const handleSaveRelationship = async (existingPersonId, relationshipType, newPersonData) => {
    setLocalError('');
    try {
        if (!user) throw new Error("User not authenticated.");
        const batch = writeBatch(db);
        const newPersonRef = doc(collection(db, "persons"));
        const existingPerson = allPersons.find(p => p.id === existingPersonId);
        const baseNewPerson = createNewPersonObject(newPersonData);

        if (relationshipType === "child") {
            baseNewPerson.parents = [existingPersonId];
            if (existingPerson.spouse) {
                baseNewPerson.parents.push(existingPerson.spouse);
                const coupleQuery = query(collection(db, "couples"), where("husbandId", "in", [existingPersonId, existingPerson.spouse]), where("wifeId", "in", [existingPersonId, existingPerson.spouse]));
                const coupleSnapshot = await getDocs(coupleQuery);
                if (!coupleSnapshot.empty) {
                    const coupleDocRef = coupleSnapshot.docs[0].ref;
                    batch.update(coupleDocRef, { childrenIds: arrayUnion(newPersonRef.id) });
                }
            }
            batch.set(newPersonRef, baseNewPerson);
            batch.update(doc(db, "persons", existingPersonId), { children: arrayUnion(newPersonRef.id) });
            if (existingPerson.spouse) {
                batch.update(doc(db, "persons", existingPerson.spouse), { children: arrayUnion(newPersonRef.id) });
            }
        } else if (relationshipType === "sibling") {
             if (!existingPerson?.parents || existingPerson.parents.length === 0) {
                setLocalError("Cannot add a sibling to someone with no parents.");
                return;
            }
            baseNewPerson.parents = existingPerson.parents;
            batch.set(newPersonRef, baseNewPerson);
            existingPerson.parents.forEach(parentId => {
                batch.update(doc(db, "persons", parentId), { children: arrayUnion(newPersonRef.id) });
            });
        }
      
        await batch.commit();
        setIsAdding(false);
    } catch(err) {
        console.error("Error saving relationship", err);
        setLocalError("Failed to save relationship.");
    }
  };

  const handleDeletePerson = async (personIdToDelete) => {
    if (!window.confirm("Are you sure? This will permanently delete this person and update all related family members. This action cannot be undone.")) {
      return;
    }
    
    setLocalError('');
    try {
      const personToDelete = allPersons.find(p => p.id === personIdToDelete);
      if (!personToDelete) throw new Error("Person not found in local data.");

      const batch = writeBatch(db);

      // 1. Update spouse: Set their spouse field to null
      if (personToDelete.spouse) {
        const spouseRef = doc(db, "persons", personToDelete.spouse);
        batch.update(spouseRef, { spouse: null });
      }

      // 2. Update parents: Remove person from their children array
      if (personToDelete.parents && personToDelete.parents.length > 0) {
        personToDelete.parents.forEach(parentId => {
          const parentRef = doc(db, "persons", parentId);
          batch.update(parentRef, { children: arrayRemove(personIdToDelete) });
        });
      }

      // 3. Update children: Remove person from their parents array
      if (personToDelete.children && personToDelete.children.length > 0) {
        personToDelete.children.forEach(childId => {
          const childRef = doc(db, "persons", childId);
          batch.update(childRef, { parents: arrayRemove(personIdToDelete) });
        });
      }
      
      // 4. Delete any couple documents this person is a part of
      const coupleQuery = query(collection(db, "couples"), where("husbandId", "==", personIdToDelete));
      const coupleQuery2 = query(collection(db, "couples"), where("wifeId", "==", personIdToDelete));
      
      const [husbandCouples, wifeCouples] = await Promise.all([
          getDocs(coupleQuery),
          getDocs(coupleQuery2)
      ]);
      
      husbandCouples.forEach(doc => batch.delete(doc.ref));
      wifeCouples.forEach(doc => batch.delete(doc.ref));

      // 5. Finally, delete the person themselves
      const personRef = doc(db, "persons", personIdToDelete);
      batch.delete(personRef);

      await batch.commit();
      
    } catch (err) {
      console.error("Failed to delete person and clean up relations:", err);
      setLocalError("Failed to delete person. Check console for details.");
    }
  };

  const handleUpdatePerson = async (personId, updatedData) => {
    try {
      await updateDoc(doc(db, "persons", personId), updatedData);
      setIsEditing(false);
    } catch (err) { setLocalError("Failed to update person."); }
  };

  const openAddModal = (person, type) => {
    setPersonToModify(person);
    setAddMode(type);
    setIsAdding(true);
  };
  
  const openEditModal = (person) => {
    setPersonToModify(person);
    setIsEditing(true);
  };
  

  const getRelationshipToUser = useCallback((person) => {
    if (!userPerson || !person || person.id === userPerson.id) return "You";

    const myParents = userPerson.parents || [];
    const theirParents = person.parents || [];

    // Direct
    if (myParents.includes(person.id)) return person.gender === 'Male' ? 'Father' : 'Mother';
    if (userPerson.children?.includes(person.id)) return person.gender === 'Male' ? 'Son' : 'Daughter';
    if (userPerson.spouse === person.id || person.spouse === userPerson.id)
      return person.gender === 'Male' ? 'Husband' : 'Wife';

    // Sibling
    if (
      myParents.length > 0 &&
      theirParents.length > 0 &&
      myParents.some(pId => theirParents.includes(pId))
    ) return person.gender === 'Male' ? 'Brother' : 'Sister';

    // Grandparent
    for (const parentId of myParents) {
      const parent = allPersons.find(p => p.id === parentId);
      if (parent?.parents?.includes(person.id)) {
        return person.gender === 'Male' ? 'Grandfather' : 'Grandmother';
      }
    }

    // Grandchild
    if (userPerson.children?.length > 0) {
      for (const childId of userPerson.children) {
        if (theirParents.includes(childId)) {
          return person.gender === 'Male' ? 'Grandson' : 'Granddaughter';
        }
      }
    }

    // In-laws (spouse’s family)
    if (userPerson.spouse) {
      const spouse = allPersons.find(p => p.id === userPerson.spouse);
      if (spouse) {
        if (spouse.parents?.includes(person.id))
          return person.gender === 'Male' ? 'Father-in-law' : 'Mother-in-law';

        const spouseSiblings = allPersons.filter(
          p => p.id !== spouse.id &&
          p.parents?.length &&
          spouse.parents?.some(pId => p.parents.includes(pId))
        );

        if (spouseSiblings.some(s => s.id === person.id))
          return person.gender === 'Male' ? 'Brother-in-law' : 'Sister-in-law';
      }
    }

    // Sibling’s spouse (your sister’s husband / brother’s wife)
    const mySiblings = allPersons.filter(
      p => p.id !== userPerson.id &&
      p.parents?.length &&
      myParents.some(pId => p.parents.includes(pId))
    );

    for (const sibling of mySiblings) {
      if (sibling.spouse === person.id || person.spouse === sibling.id) {
        return person.gender === 'Male' ? 'Brother-in-law' : 'Sister-in-law';
      }
      if (sibling.children?.includes(person.id)) {
        return person.gender === 'Male' ? 'Nephew' : 'Niece';
      }
    }

    // Child’s spouse
    if (userPerson.children?.some(childId => {
      const child = allPersons.find(p => p.id === childId);
      return child?.spouse === person.id || person.spouse === childId;
    })) return person.gender === 'Male' ? 'Son-in-law' : 'Daughter-in-law';

    // Step-parent (parent’s spouse not your parent)
    for (const parentId of myParents) {
      const parent = allPersons.find(p => p.id === parentId);
      if (parent?.spouse === person.id && !myParents.includes(person.id)) {
        return person.gender === 'Male' ? 'Stepfather' : 'Stepmother';
      }
    }

    // Uncle / Aunt and Cousin
    for (const parentId of myParents) {
      const parent = allPersons.find(p => p.id === parentId);
      if (parent) {
        const parentSiblings = allPersons.filter(
          p => p.id !== parentId &&
          p.parents?.length &&
          parent.parents?.some(gpId => p.parents.includes(gpId))
        );

        if (parentSiblings.some(s => s.id === person.id))
          return person.gender === 'Male' ? 'Uncle' : 'Aunt';

        for (const uncleOrAunt of parentSiblings) {
          if (uncleOrAunt.children?.includes(person.id)) {
            return 'Cousin';
          }
        }
      }
    }

    return "Relative";
  }, [userPerson, allPersons]);

  
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
  
  return {
    user, allPersons, userPerson, error: dataError || localError,
    connections, outgoingRequests,
    isAdding, setIsAdding, isEditing, setIsEditing, personToModify, addMode,
    searchQuery, setSearchQuery, searchResults, searchMessage,
    handleSaveCouple, handleSaveRelationship,
    handleDeletePerson, handleUpdatePerson,
    openAddModal, openEditModal, getRelationshipToUser,
    handleUserSearch, handleSendRequest, getConnectionStatus
  };
}