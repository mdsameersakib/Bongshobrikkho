import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// A reusable form section for a single person's details
const PersonForm = ({ title, personData, onFormChange, prefix, disabledGender = false }) => (
    <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">{title}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name={`${prefix}FirstName`} value={personData[`${prefix}FirstName`]} onChange={onFormChange} placeholder="First Name" required className="w-full p-2 border border-gray-300 rounded-lg" />
            <input name={`${prefix}LastName`} value={personData[`${prefix}LastName`]} onChange={onFormChange} placeholder="Last Name" className="w-full p-2 border border-gray-300 rounded-lg" />
            <select name={`${prefix}Gender`} value={personData[`${prefix}Gender`]} disabled={disabledGender} onChange={onFormChange} className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 disabled:opacity-75">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </select>
            <input type="date" name={`${prefix}BirthDate`} value={personData[`${prefix}BirthDate`]} onChange={onFormChange} className="w-full p-2 border border-gray-300 rounded-lg" />
        </div>
    </div>
);

export default function AddCoupleModal({ person, relationshipType, onSave, onClose }) {
  const [formData, setFormData] = useState({
    fatherFirstName: '', fatherLastName: '', fatherGender: 'Male', fatherBirthDate: '',
    motherFirstName: '', motherLastName: '', motherGender: 'Female', motherBirthDate: '',
    spouseFirstName: '', spouseLastName: '', spouseGender: 'Female', spouseBirthDate: '',
    marriageDate: '',
  });

  useEffect(() => {
      // Intelligently pre-fill the gender of the new spouse based on the existing person
      if(relationshipType === 'spouse') {
          const newSpouseGender = person.gender === 'Male' ? 'Female' : 'Male';
          setFormData(prev => ({ ...prev, spouseGender: newSpouseGender }));
      }
  }, [relationshipType, person]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(person, relationshipType, formData);
  };
  
  const isAddingParents = relationshipType === 'parents';
  const isAddingSpouse = relationshipType === 'spouse';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-fade-in-scale">
        <form onSubmit={handleSave} className="p-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{isAddingParents ? 'Add Parents' : 'Add Spouse'}</h3>
              <p className="text-sm text-gray-500">
                {isAddingParents ? `Adding parents to: ` : `Adding spouse to: `}
                <span className="font-semibold text-teal-600">{person.firstName} {person.lastName}</span>
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
          <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {isAddingParents && (
              <>
                <PersonForm title="Father's Details" personData={formData} onFormChange={handleFormChange} prefix="father" disabledGender={true}/>
                <hr/>
                <PersonForm title="Mother's Details" personData={formData} onFormChange={handleFormChange} prefix="mother" disabledGender={true}/>
              </>
            )}
            {isAddingSpouse && (
              <PersonForm title="New Spouse's Details" personData={formData} onFormChange={handleFormChange} prefix="spouse" />
            )}
            <hr/>
            <div>
              <label htmlFor="marriageDate" className="block text-sm font-medium text-gray-700 mb-1">Marriage Date (Required)</label>
              <input id="marriageDate" name="marriageDate" type="date" value={formData.marriageDate} onChange={handleFormChange} required className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t mt-6 space-x-3">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-md">Save</button>
          </div>
        </form>
      </div>
       <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}.animate-fade-in-scale{animation:fadeInScale .3s ease-out forwards}`}</style>
    </div>
  );
}