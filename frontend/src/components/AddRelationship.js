import React, { useState } from 'react';

// This component is a modal/form for adding a new relative.
// It receives the person we're adding a relative TO, a function to handle saving,
// and a function to close itself.
function AddRelationship({ existingPerson, onSave, onClose }) {
  // State for the new person's details
  const [newPersonData, setNewPersonData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    birthDate: '',
  });

  // State for the selected relationship type
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
    // Call the onSave function passed from the parent, sending all the data.
    onSave(existingPerson.id, relationshipType, newPersonData);
  };

  return (
    // The "modal-backdrop" is a semi-transparent background
    <div className="modal-backdrop">
      {/* The "modal-content" is the form itself */}
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
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="spouse">Spouse (Husband/Wife)</option>
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
            {/* The onClose function is called when the cancel button is clicked */}
            <button type="button" onClick={onClose} className="action-button cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRelationship;
