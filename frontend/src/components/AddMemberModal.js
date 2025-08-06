import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// This is our new, well-designed modal component.
export default function AddMemberModal({ existingPerson, onSave, onClose }) {
  const [newPersonData, setNewPersonData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    birthDate: '',
  });
  const [relationshipType, setRelationshipType] = useState('child');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewPersonData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!newPersonData.firstName) {
      alert("First name is required.");
      return;
    }
    onSave(existingPerson.id, relationshipType, newPersonData);
  };

  // This check determines if the "Sibling" option should be available.
  const hasParents = existingPerson.parents && existingPerson.parents.length > 0;

  return (
    // Modal backdrop with a fade-in effect
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      {/* Modal content with a slide-in effect */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Add a New Relative</h3>
              <p className="text-sm text-gray-500">Adding relative to: <span className="font-semibold text-teal-600">{existingPerson.firstName} {existingPerson.lastName}</span></p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          {/* Modal Body - The Form */}
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700 mb-1">Relationship to {existingPerson.firstName}</label>
              <select
                id="relationshipType"
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="child">Child (Son/Daughter)</option>
                <option value="spouse">Spouse (Husband/Wife)</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="sibling" disabled={!hasParents} title={!hasParents ? "Add parents to this person first" : ""}>
                  Sibling (Brother/Sister)
                </option>
              </select>
            </div>

            <hr/>

            <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">New Person's Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="firstName" value={newPersonData.firstName} onChange={handleFormChange} placeholder="First Name" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    <input name="lastName" value={newPersonData.lastName} onChange={handleFormChange} placeholder="Last Name" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    <select name="gender" value={newPersonData.gender} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <input type="date" name="birthDate" value={newPersonData.birthDate} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="flex justify-end pt-6 border-t space-x-3">
              <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 shadow-md">
                Save Relationship
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}