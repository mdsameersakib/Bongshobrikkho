// import React, { useState } from 'react';
// import { db } from '../services/firebase';
// import { 
//   collection, 
//   addDoc,
//   query,
//   where,
//   getDocs,
//   Timestamp
// } from "firebase/firestore";

// // This component receives the current user and their connection data as props
// function UserSearch({ user, outgoingRequests, connections }) {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [searchMessage, setSearchMessage] = useState('');
//   const [error, setError] = useState('');

//   const handleUserSearch = async (e) => {
//     e.preventDefault();
//     if (!searchQuery) return;

//     setSearchMessage('Searching...');
//     setSearchResults([]);
//     setError('');
    
//     try {
//       const q = query(collection(db, "users"), where("email", "==", searchQuery));
//       const querySnapshot = await getDocs(q);
      
//       const results = querySnapshot.docs
//         .map(doc => doc.data())
//         .filter(foundUser => foundUser.uid !== user.uid); // Don't show self in results

//       setSearchResults(results);
//       setSearchMessage(results.length === 0 ? 'No users found with that email.' : '');
//     } catch (err) {
//       setError('An error occurred during search.');
//     }
//   };

//   const handleSendRequest = async (recipient) => {
//     try {
//       await addDoc(collection(db, "connections"), {
//         requesterUid: user.uid,
//         requesterEmail: user.email,
//         recipientUid: recipient.uid,
//         recipientEmail: recipient.email,
//         status: 'pending',
//         createdAt: Timestamp.now(),
//       });
//       alert("Request Sent!");
//     } catch (err) {
//       setError("Failed to send request.");
//     }
//   };

//   // Helper to check the connection status with another user
//   const getConnectionStatus = (targetUid) => {
//     if (outgoingRequests.some(req => req.recipientUid === targetUid)) {
//       return 'Pending';
//     }
//     if (connections.some(con => con.requesterUid === targetUid || con.recipientUid === targetUid)) {
//       return 'Connected';
//     }
//     return 'None';
//   };

//   return (
//     <div className="card">
//       <h2>Find Family Members</h2>
//       {error && <p className="error-message">{error}</p>}
//       <form onSubmit={handleUserSearch} className="person-form">
//         <input
//           type="email"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           placeholder="Search by user's email"
//           className="auth-input"
//         />
//         <button type="submit" className="auth-button">Search</button>
//       </form>
//       <div className="search-results">
//         {searchMessage && <p>{searchMessage}</p>}
//         {searchResults.map(foundUser => {
//           const status = getConnectionStatus(foundUser.uid);
//           return (
//             <div key={foundUser.uid} className="person-item">
//                <div className="display-view">
//                   <p>{foundUser.displayName}</p>
//                   <button 
//                     onClick={() => handleSendRequest(foundUser)} 
//                     className={`action-button ${status !== 'None' ? 'disabled' : 'save'}`}
//                     disabled={status !== 'None'}
//                   >
//                     {status === 'Pending' ? 'Request Sent' : status === 'Connected' ? 'Connected' : 'Send Request'}
//                   </button>
//                 </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// export default UserSearch;
