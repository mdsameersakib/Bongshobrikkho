import React, { useState } from 'react';
import { db, auth } from '../services/firebase';
import {
  collection, doc, writeBatch, arrayUnion, deleteDoc, updateDoc,
  query, where, getDocs, Timestamp, addDoc
} from 'firebase/firestore';

import useConnections from '../hooks/useConnections';
import usePersons from '../hooks/usePersons';

import AddMemberModal from '../components/AddMemberModal';
import EditMemberModal from '../components/EditMemberModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons';

export default function FamilyListPage() {
  const [user] = useState(auth.currentUser);
  
  const { accepted: connections, outgoing: outgoingRequests } = useConnections(user);
  const { allPersons, userPerson, error: dataError } = usePersons(user, connections);

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personToModify, setPersonToModify] = useState(null);
  const [localError, setLocalError] = useState('');

  // --- State for Search Functionality ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');

  // --- DATA MUTATION LOGIC ---
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
        batch.update(newPersonRef, { spouse: existingPersonId });
      } else if (relationshipType === "sibling") {
        if (!existingPerson?.parents || existingPerson.parents.length === 0) {
          setLocalError("Cannot add a sibling to someone with no parents.");
          return;
        }
        batch.set(newPersonRef, { ...baseNewPerson, parents: existingPerson.parents });
        existingPerson.parents.forEach(parentId => {
          const parentRef = doc(db, "persons", parentId);
          batch.update(parentRef, { children: arrayUnion(newPersonRef.id) });
        });
      }
      await batch.commit();
      setIsAdding(false);
    } catch (err) { setLocalError("Failed to create relationship."); }
  };
  
  const handleDeletePerson = async (personId) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
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
  
  // --- UI HELPER FUNCTIONS ---
  const openAddModal = (person) => {
    setPersonToModify(person);
    setIsAdding(true);
  };
  
  const openEditModal = (person) => {
    setPersonToModify(person);
    setIsEditing(true);
  };
  
  const getRelationshipToUser = (person) => {
    if (!userPerson || person.id === userPerson.id) return "You";
    if (userPerson.parents?.includes(person.id)) return person.gender === 'Male' ? 'Father' : 'Mother';
    if (userPerson.children?.includes(person.id)) return person.gender === 'Male' ? 'Son' : 'Daughter';
    if (userPerson.spouse === person.id) return person.gender === 'Male' ? 'Husband' : 'Wife';
    if (userPerson.parents?.some(pId => person.parents?.includes(pId))) return person.gender === 'Male' ? 'Brother' : 'Sister';
    // Add full relationship logic here for grandparents, cousins, etc. in the future
    return "Relative";
  };

  // --- SEARCH LOGIC ---
  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearchMessage('Searching...');
    setSearchResults([]);
    setLocalError('');
    try {
      const q = query(collection(db, "users"), where("email", "==", searchQuery));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs
        .map(doc => doc.data())
        .filter(foundUser => foundUser.uid !== user.uid);
      setSearchResults(results);
      setSearchMessage(results.length === 0 ? 'No users found with that email.' : '');
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
      setSearchResults([]);
      setSearchQuery('');
      setSearchMessage('');
    } catch (err) { setLocalError("Failed to send request."); }
  };

  const getConnectionStatus = (targetUid) => {
    if (outgoingRequests.some(req => req.recipientUid === targetUid)) return 'Pending';
    if (connections.some(con => con.requesterUid === targetUid || con.recipientUid === targetUid)) return 'Connected';
    return 'None';
  };

  return (
    <>
      {isAdding && (
        <AddMemberModal 
          existingPerson={personToModify}
          onSave={handleSaveRelationship}
          onClose={() => setIsAdding(false)}
        />
      )}
      {isEditing && (
        <EditMemberModal
          person={personToModify}
          onSave={handleUpdatePerson}
          onClose={() => setIsEditing(false)}
        />
      )}

      <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Family List & Connections</h2>
          <p className="text-gray-500 mt-1">Manage your family and find new relatives.</p>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={handleUserSearch} className="relative">
            <input 
              type="text" 
              placeholder="Search by email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-teal-500"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <i className="fas fa-search"></i>
            </button>
          </form>
          <button onClick={() => openAddModal(userPerson)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex-shrink-0">
            <i className="fas fa-plus mr-2"></i>Add Member
          </button>
        </div>
      </header>
      
      {(dataError || localError) && <p className="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg">{dataError || localError}</p>}
      
      {(searchResults.length > 0 || searchMessage) && (
        <div className="mb-6 bg-white shadow-md rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2">Search Results</h3>
          {searchMessage && <p className="text-gray-500 text-sm">{searchMessage}</p>}
          <div className="space-y-2">
            {searchResults.map(foundUser => {
              const status = getConnectionStatus(foundUser.uid);
              return (
                <div key={foundUser.uid} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium">{foundUser.displayName}</p>
                  <button 
                    onClick={() => handleSendRequest(foundUser)} 
                    disabled={status !== 'None'}
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      status === 'None' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {status === 'Pending' ? 'Request Sent' : status === 'Connected' ? 'Connected' : 'Send Request'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status / Invite Code</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allPersons.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={`https://placehold.co/40x40/2c7a7b/ffffff?text=${person.firstName?.[0]?.toUpperCase() || '?'}`} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{person.firstName} {person.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getRelationshipToUser(person)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.birthDate || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {person.claimedByUid ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Claimed</span>
                    ) : (
                      <span className="font-mono bg-gray-200 text-gray-700 py-0.5 px-1.5 rounded text-xs">{person.invitationCode}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openAddModal(person)} className="text-blue-600 hover:text-blue-900 mr-4" title="Add Relative">
                      <FontAwesomeIcon icon={faUserPlus} />
                    </button>
                    <button onClick={() => openEditModal(person)} className="text-teal-600 hover:text-teal-900 mr-4" title="Edit">
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    {person.creatorUid === user.uid && (
                       <button onClick={() => handleDeletePerson(person.id)} className="text-red-600 hover:text-red-900" title="Delete">
                         <FontAwesomeIcon icon={faTrash} />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}