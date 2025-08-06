import React from 'react';
import useFamilyList from '../hooks/useFamilyList';

// Import the UI Components
import AddMemberModal from '../components/AddMemberModal';
import EditMemberModal from '../components/EditMemberModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons';

export default function FamilyListPage() {
  // Call the hook at the top to get all state and logic
  const logic = useFamilyList();

  return (
    <>
      {logic.isAdding && (
        <AddMemberModal 
          existingPerson={logic.personToModify}
          onSave={logic.handleSaveRelationship}
          onClose={() => logic.setIsAdding(false)}
        />
      )}
      {logic.isEditing && (
        <EditMemberModal
          person={logic.personToModify}
          onSave={logic.handleUpdatePerson}
          onClose={() => logic.setIsEditing(false)}
        />
      )}

      <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Family List & Connections</h2>
          <p className="text-gray-500 mt-1">Manage your family and find new relatives.</p>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={logic.handleUserSearch} className="relative">
            <input 
              type="text" 
              placeholder="Search by email..." 
              value={logic.searchQuery}
              onChange={(e) => logic.setSearchQuery(e.target.value)}
              className="w-full md:w-64 border-gray-300 rounded-lg pl-10 pr-4 py-2"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <i className="fas fa-search"></i>
            </button>
          </form>
          <button onClick={() => logic.openAddModal(logic.userPerson)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
            <i className="fas fa-plus mr-2"></i>Add Member
          </button>
        </div>
      </header>
      
      {logic.error && <p className="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg">{logic.error}</p>}
      
      {(logic.searchResults.length > 0 || logic.searchMessage) && (
        <div className="mb-6 bg-white shadow-md rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2">Search Results</h3>
          {logic.searchMessage && <p className="text-gray-500 text-sm">{logic.searchMessage}</p>}
          <div className="space-y-2">
            {logic.searchResults.map(foundUser => {
              const status = logic.getConnectionStatus(foundUser.uid);
              return (
                <div key={foundUser.uid} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium">{foundUser.displayName}</p>
                  <button 
                    onClick={() => logic.handleSendRequest(foundUser)} 
                    disabled={status !== 'None'}
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${ status === 'None' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-600 cursor-not-allowed' }`}
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
              {logic.allPersons.map((person) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{logic.getRelationshipToUser(person)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.birthDate || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {person.claimedByUid ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Claimed</span>
                    ) : (
                      <span className="font-mono bg-gray-200 text-gray-700 py-0.5 px-1.5 rounded text-xs">{person.invitationCode}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => logic.openAddModal(person)} className="text-blue-600 hover:text-blue-900 mr-4" title="Add Relative">
                      <FontAwesomeIcon icon={faUserPlus} />
                    </button>
                    <button onClick={() => logic.openEditModal(person)} className="text-teal-600 hover:text-teal-900 mr-4" title="Edit">
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    {person.creatorUid === logic.user.uid && (
                       <button onClick={() => logic.handleDeletePerson(person.id)} className="text-red-600 hover:text-red-900" title="Delete">
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