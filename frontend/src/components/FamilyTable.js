import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

// This is a "Presentational" component. It just displays data and calls functions it receives as props.
const FamilyTable = ({
  allPersons,
  user,
  userPerson,
  editingPersonId,
  editingPersonData,
  getRelationshipToUser,
  handleFormChange,
  handleUpdatePerson,
  setEditingPersonId,
  startEditing,
  handleDeletePerson
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status / Invite Code</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allPersons.map((person) => (
              editingPersonId === person.id ? (
                // Row in Edit Mode
                <tr key={`${person.id}-edit`} className="bg-teal-50">
                  <td className="px-6 py-4">
                    <input type="text" name="firstName" value={editingPersonData.firstName} onChange={handleFormChange} className="w-full p-1 border rounded text-sm" />
                    <input type="text" name="lastName" value={editingPersonData.lastName} onChange={handleFormChange} className="w-full p-1 border rounded mt-1 text-sm" />
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4">
                    <input type="date" name="birthDate" value={editingPersonData.birthDate} onChange={handleFormChange} className="w-full p-1 border rounded text-sm" />
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleUpdatePerson(person.id)} className="text-green-600 hover:text-green-900 font-bold">Save</button>
                    <button onClick={() => setEditingPersonId(null)} className="text-gray-600 hover:text-gray-900 ml-4 font-bold">Cancel</button>
                  </td>
                </tr>
              ) : (
                // Row in Display Mode
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
                    <button onClick={() => startEditing(person)} className="text-teal-600 hover:text-teal-900 mr-4" title="Edit"><FontAwesomeIcon icon={faPen} /></button>
                    {person.creatorUid === user.uid && (
                       <button onClick={() => handleDeletePerson(person.id)} className="text-red-600 hover:text-red-900" title="Delete"><FontAwesomeIcon icon={faTrash} /></button>
                    )}
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FamilyTable;