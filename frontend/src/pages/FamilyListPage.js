import React from 'react';
import useFamilyList from '../hooks/useFamilyList';

import AddCoupleModal from '../components/AddCoupleModal';
import AddMemberModal from '../components/AddMemberModal';
import EditMemberModal from '../components/EditMemberModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faTrash,
  faUserPlus,
  faHeart,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

// --- NEW: Card component for mobile view ---
const PersonCard = ({ person, logic }) => (
  <div className="accent-surface dark:accent-surface shadow-md rounded-lg mb-4 overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
    {/* Card Header */}
  <div className="flex items-center p-4 border-b accent-surface-soft dark:accent-surface-soft border-slate-200/70 dark:border-slate-700/60">
    {person.profileImageUrl ? (
      <img
        className="h-12 w-12 rounded-full object-cover"
        src={person.profileImageUrl}
        alt="Profile"
      />
    ) : (
      <img
        className="h-12 w-12 rounded-full"
        src={`https://placehold.co/48x48/2c7a7b/ffffff?text=${
          person.firstName?.[0]?.toUpperCase() || '?'
        }`}
        alt=""
      />
    )}
    <div className="ml-4">
  <div className="text-lg font-bold text-black dark:text-white">
          {person.firstName} {person.lastName}
        </div>
  <div className="text-sm text-black/70 dark:text-white/70">
          {logic.getRelationshipToUser(person)}
        </div>
      </div>
    </div>

    {/* Card Body */}
  <div className="p-4 space-y-3">
      <div className="flex justify-between text-sm">
        <strong className="text-black/70 dark:text-white/70">Date of Birth:</strong>
        <span>{person.birthDate || 'N/A'}</span>
      </div>
      <div className="flex justify-between text-sm items-center">
        <strong className="text-black/70 dark:text-white/70">Status:</strong>
        {person.claimedByUid ? (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Claimed
          </span>
        ) : (
          <span className="font-mono bg-gray-200 text-gray-700 py-0.5 px-1.5 rounded text-xs">
            {person.invitationCode}
          </span>
        )}
      </div>
    </div>

    {/* Card Footer Actions */}
  <div className="grid grid-cols-5 gap-1 p-2 accent-surface-soft dark:accent-surface-soft border-t border-slate-200/70 dark:border-slate-700/60">
      <button
        onClick={() => logic.openAddModal(person, 'child')}
        className="text-green-600 hover:bg-green-100 rounded-md p-2 flex flex-col items-center"
        title="Add Child or Sibling"
      >
        <FontAwesomeIcon icon={faUserPlus} />
        <span className="text-xs mt-1">Child</span>
      </button>
      <button
        onClick={() => logic.openAddModal(person, 'spouse')}
        className="text-pink-600 hover:bg-pink-100 rounded-md p-2 flex flex-col items-center"
        title="Add Spouse"
      >
        <FontAwesomeIcon icon={faHeart} />
        <span className="text-xs mt-1">Spouse</span>
      </button>
      <button
        onClick={() => logic.openAddModal(person, 'parents')}
        className="text-blue-600 hover:bg-blue-100 rounded-md p-2 flex flex-col items-center"
        title="Add Parents"
      >
        <FontAwesomeIcon icon={faUsers} />
        <span className="text-xs mt-1">Parents</span>
      </button>
      <button
        onClick={() => logic.openEditModal(person)}
        className="text-teal-600 hover:bg-teal-100 rounded-md p-2 flex flex-col items-center"
        title="Edit"
      >
        <FontAwesomeIcon icon={faPen} />
        <span className="text-xs mt-1">Edit</span>
      </button>
      {person.creatorUid === logic.user.uid && (
        <button
          onClick={() => logic.handleDeletePerson(person.id)}
          className="text-red-600 hover:bg-red-100 rounded-md p-2 flex flex-col items-center"
          title="Delete"
        >
          <FontAwesomeIcon icon={faTrash} />
          <span className="text-xs mt-1">Delete</span>
        </button>
      )}
    </div>
  </div>
);

export default function FamilyListPage() {
  const logic = useFamilyList();

  const renderAddModal = () => {
    if (!logic.isAdding) return null;
    if (logic.addMode === 'parents' || logic.addMode === 'spouse') {
      return (
        <AddCoupleModal
          person={logic.personToModify}
          relationshipType={logic.addMode}
          onSave={logic.handleSaveCouple}
          onClose={() => logic.setIsAdding(false)}
        />
      );
    } else {
      return (
        <AddMemberModal
          existingPerson={logic.personToModify}
          onSave={logic.handleSaveRelationship}
          onClose={() => logic.setIsAdding(false)}
        />
      );
    }
  };

  return (
    <>
      {renderAddModal()}

      {logic.isEditing && (
        <EditMemberModal
          person={logic.personToModify}
          onSave={logic.handleUpdatePerson}
          onClose={() => logic.setIsEditing(false)}
        />
      )}

      <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-black dark:text-white">
            Family List & Connections
          </h2>
          <p className="text-black/70 dark:text-white/70 mt-1">
            Manage your family and find new relatives.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={logic.handleUserSearch} className="relative">
            <input
              type="text"
              placeholder="Search by email..."
              value={logic.searchQuery}
              onChange={(e) => logic.setSearchQuery(e.target.value)}
              className="w-full md:w-64 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg pl-10 pr-4 py-2 text-black dark:text-white placeholder-black/50 dark:placeholder-white/40"
            />
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
            >
              <i className="fas fa-search"></i>
            </button>
          </form>
          <button
            onClick={() => logic.openAddModal(logic.userPerson, 'child')}
            className="btn btn-primary font-semibold py-2 px-4 rounded-lg shadow"
          >
            <i className="fas fa-plus mr-2"></i>Add Member
          </button>
        </div>
      </header>

      {logic.error && (
        <p className="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {logic.error}
        </p>
      )}

      {(logic.searchResults.length > 0 || logic.searchMessage) && (
  <div className="mb-6 accent-surface dark:accent-surface shadow-md rounded-lg p-4 border border-slate-200/70 dark:border-slate-700/60">
          <h3 className="font-bold text-lg mb-2">Search Results</h3>
          {logic.searchMessage && (
            <p className="text-black/70 dark:text-white/70 text-sm">{logic.searchMessage}</p>
          )}
          <div className="space-y-2">
            {logic.searchResults.map((foundUser) => {
              const status = logic.getConnectionStatus(foundUser.uid);
              return (
                <div
                  key={foundUser.uid}
                  className="flex justify-between items-center p-2 accent-surface-soft rounded border border-slate-200/50 dark:border-slate-700/40"
                >
                    <p className="text-sm font-medium text-black dark:text-white">{foundUser.displayName}</p>
                  <button
                    onClick={() => logic.handleSendRequest(foundUser)}
                    disabled={status !== 'None'}
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      status === 'None'
                        ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                        : 'bg-slate-300 dark:bg-slate-700 text-black dark:text-white cursor-not-allowed'
                    }`}
                  >
                    {status === 'Pending'
                      ? 'Request Sent'
                      : status === 'Connected'
                      ? 'Connected'
                      : 'Send Request'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Responsive Layout Section --- */}
      
      {/* Mobile Card Layout (Visible on small screens, hidden on medium and up) */}
      <div className="md:hidden">
        {logic.allPersons.map((person) => (
          <PersonCard key={person.id} person={person} logic={logic} />
        ))}
      </div>

      {/* Desktop Table Layout (Hidden on small screens, visible on medium and up) */}
  <div className="hidden md:block accent-surface dark:accent-surface shadow-md rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
    <thead className="accent-surface-soft">
              <tr>
                <th
                  scope="col"
      className="px-6 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
      className="px-6 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase tracking-wider"
                >
                  Relationship
                </th>
                <th
                  scope="col"
      className="px-6 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase tracking-wider"
                >
                  Date of Birth
                </th>
                <th
                  scope="col"
      className="px-6 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase tracking-wider"
                >
                  Status / Invite Code
                </th>
                <th
                  scope="col"
      className="px-6 py-4 text-right text-xs font-semibold text-black dark:text-white uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="accent-surface divide-y divide-gray-200 dark:divide-slate-800">
              {logic.allPersons.map((person) => (
                <tr key={person.id} className="even:accent-surface-soft hover:accent-surface-soft transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {person.profileImageUrl ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={person.profileImageUrl}
                            alt="Profile"
                          />
                        ) : (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={`https://placehold.co/40x40/2c7a7b/ffffff?text=${
                              person.firstName?.[0]?.toUpperCase() || '?'
                            }`}
                            alt=""
                          />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-black dark:text-white">
                          {person.firstName} {person.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black/70 dark:text-white/70">
                    {logic.getRelationshipToUser(person)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black/70 dark:text-white/70">
                    {person.birthDate || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {person.claimedByUid ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Claimed
                      </span>
                    ) : (
                      <span className="font-mono bg-gray-200 text-gray-700 py-0.5 px-1.5 rounded text-xs">
                        {person.invitationCode}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => logic.openAddModal(person, 'child')}
                      className="text-green-600 hover:text-green-900 mr-4"
                      title="Add Child or Sibling"
                    >
                      <FontAwesomeIcon icon={faUserPlus} />
                    </button>
                    <button
                      onClick={() => logic.openAddModal(person, 'spouse')}
                      className="text-pink-600 hover:text-pink-900 mr-4"
                      title="Add Spouse"
                    >
                      <FontAwesomeIcon icon={faHeart} />
                    </button>
                    <button
                      onClick={() => logic.openAddModal(person, 'parents')}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Add Parents"
                    >
                      <FontAwesomeIcon icon={faUsers} />
                    </button>
                    <button
                      onClick={() => logic.openEditModal(person)}
                      className="text-accent hover:text-accent/80 mr-4"
                      title="Edit"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    {person.creatorUid === logic.user.uid && (
                      <button
                        onClick={() => logic.handleDeletePerson(person.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
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