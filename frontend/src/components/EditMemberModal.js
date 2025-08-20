import React, { useState, useEffect } from 'react';
import useCloudinaryUpload from '../hooks/useCloudinaryUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

export default function EditMemberModal({ person, onSave, onClose }) {
  const [personData, setPersonData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    birthDate: '',
    marriageDate: '',
    deathDate: '',
    profileImageUrl: '',
  });
  const { upload, uploading, error: uploadError } = useCloudinaryUpload();

  useEffect(() => {
    if (person) {
      setPersonData({
        firstName: person.firstName || '',
        lastName: person.lastName || '',
        gender: person.gender || 'Male',
        birthDate: person.birthDate || '',
        marriageDate: person.marriageDate || '',
        deathDate: person.deathDate || '',
        profileImageUrl: person.profileImageUrl || '',
      });
    }
  }, [person]);

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = await upload(file);
    if (imageUrl) {
      setPersonData(prev => ({ ...prev, profileImageUrl: imageUrl }));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPersonData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!personData.firstName) {
      alert("First name is required.");
      return;
    }
    onSave(person.id, personData);
  };

  if (!person) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-scale">
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Edit Family Member</h3>
              <p className="text-sm text-gray-500">Editing profile for: <span className="font-semibold text-teal-600">{person.firstName} {person.lastName}</span></p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Personal Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="firstName" value={personData.firstName} onChange={handleFormChange} placeholder="First Name" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                <input name="lastName" value={personData.lastName} onChange={handleFormChange} placeholder="Last Name" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                <select name="gender" value={personData.gender} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input type="date" name="birthDate" value={personData.birthDate} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              {/* Profile Image Upload */}
              <div className="mt-4 flex flex-col items-center">
                <label htmlFor="profile-upload-edit" className="cursor-pointer group relative">
                  <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500 select-none overflow-hidden">
                    {personData.profileImageUrl ? (
                      <img src={personData.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      (personData.firstName || '?')[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs">Change Photo</span>
                  </div>
                </label>
                <input
                  id="profile-upload-edit"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  disabled={uploading}
                />
                {uploading && <span className="text-xs mt-2 text-slate-500">Uploading...</span>}
                {uploadError && <span className="text-xs mt-2 text-red-500">{uploadError}</span>}
              </div>
            </div>

            <hr/>

            {/* --- NEW SECTION FOR LIFE EVENTS --- */}
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Life Events</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="marriageDate" className="text-xs text-gray-500">Marriage Date</label>
                    <input id="marriageDate" type="date" name="marriageDate" value={personData.marriageDate} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label htmlFor="deathDate" className="text-xs text-gray-500">Date of Death</label>
                    <input id="deathDate" type="date" name="deathDate" value={personData.deathDate} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t space-x-3">
              <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 shadow-md">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}