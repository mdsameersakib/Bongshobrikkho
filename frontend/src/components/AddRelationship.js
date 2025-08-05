import React, { useState } from 'react';

// This component now also needs to know about allPersons to check for parents
function AddRelationship({ existingPerson, allPersons, onSave, onClose }) {
  const [newPersonData, setNewPersonData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    birthDate: '',
  });

  const [relationshipType, setRelationshipType] = useState('child');
  
  // --- NEW: Check if the person has parents to enable the sibling option ---
  const hasParents = existingPerson.parents && existingPerson.parents.length > 0;

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

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Add a Relative to {existingPerson.firstName}</h2>
        <form onSubmit={handleSave} className="person-form">
          <label>Relationship:</label>
          <select 
            value={relationshipType} 
            onChange={(e) => setRelationshipType(e.target.value)} 
            className="auth-input"
          >
            <option value="child">Child (Son/Daughter)</option>
            <option value="spouse">Spouse (Husband/Wife)</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            {/* --- NEW SIBLING OPTION --- */}
            <option 
                value="sibling" 
                disabled={!hasParents}
                title={!hasParents ? "You must add parents to this person before adding a sibling." : ""}
            >
                Sibling (Brother/Sister)
            </option>
          </select>

          <label>New Person's Details:</label>
          <input name="firstName" value={newPersonData.firstName} onChange={handleFormChange} placeholder="First Name" className="auth-input" />
          <input name="lastName" value={newPersonData.lastName} onChange={handleFormChange} placeholder="Last Name" className="auth-input" />
          <select name="gender" value={newPersonData.gender} onChange={handleFormChange} className="auth-input">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input type="date" name="birthDate" value={newPersonData.birthDate} onChange={handleFormChange} className="auth-input" />
          
          <div className="button-group">
            <button type="submit" className="action-button save">Save Relationship</button>
            <button type="button" onClick={onClose} className="action-button cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRelationship;