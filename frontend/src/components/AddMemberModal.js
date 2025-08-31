import React, { useState } from 'react';
import useCloudinaryUpload from '../hooks/useCloudinaryUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

export default function AddMemberModal({ existingPerson, onSave, onClose }) {
  const [newPersonData, setNewPersonData] = useState({
    firstName: '', lastName: '', gender: 'Male', birthDate: '', profileImageUrl: ''
  });
  const { upload, uploading, error: uploadError } = useCloudinaryUpload();
  const [relationshipType, setRelationshipType] = useState('child');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewPersonData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = await upload(file);
    if (imageUrl) {
      setNewPersonData(prev => ({ ...prev, profileImageUrl: imageUrl }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!newPersonData.firstName) {
      alert("First name is required.");
      return;
    }
    onSave(existingPerson.id, relationshipType, newPersonData);
  };
  
  const hasParents = existingPerson.parents && existingPerson.parents.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-scale border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add a New Relative</h3>
              <p className="text-sm text-gray-500 dark:text-slate-300">Adding relative to: <span className="font-semibold text-teal-600 dark:text-teal-400">{existingPerson.firstName} {existingPerson.lastName}</span></p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Relationship to {existingPerson.firstName}</label>
              <select id="relationshipType" value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} className="input">
                <option value="child">Child (Son/Daughter)</option>
                <option value="sibling" disabled={!hasParents} title={!hasParents ? "Add parents to this person first" : ""}>Sibling (Brother/Sister)</option>
              </select>
            </div>

            <hr className="border-slate-200 dark:border-slate-700"/>

            <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">New Person's Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="firstName" value={newPersonData.firstName} onChange={handleFormChange} placeholder="First Name" required className="input" />
                    <input name="lastName" value={newPersonData.lastName} onChange={handleFormChange} placeholder="Last Name" className="input" />
                    <select name="gender" value={newPersonData.gender} onChange={handleFormChange} className="input">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <input type="date" name="birthDate" value={newPersonData.birthDate} onChange={handleFormChange} className="input" />
                </div>
                {/* Profile Image Upload */}
                <div className="mt-4 flex flex-col items-center">
                  <label htmlFor="profile-upload" className="cursor-pointer group relative">
                    <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-300 select-none overflow-hidden">
                      {newPersonData.profileImageUrl ? (
                        <img src={newPersonData.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        (newPersonData.firstName || '?')[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs">Add Photo</span>
                    </div>
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-xs mt-2 text-slate-500 dark:text-slate-300">Uploading...</span>}
                  {uploadError && <span className="text-xs mt-2 text-red-500">{uploadError}</span>}
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700 space-x-3 mt-6">
              <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary shadow-md">Save Relationship</button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}.animate-fade-in-scale{animation:fadeInScale .3s ease-out forwards}`}</style>
    </div>
  );
}