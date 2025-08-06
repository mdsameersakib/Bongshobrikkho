// import React, { useState, useEffect } from 'react';
// import { db } from '../services/firebase';
// import { 
//   collection, 
//   addDoc,
//   query,
//   where,
//   onSnapshot,
//   orderBy,
//   Timestamp
// } from "firebase/firestore";

// // This component receives the current user and their connections as props
// function FamilyWall({ user, connections }) {
//   const [newPostContent, setNewPostContent] = useState('');
//   const [wallPosts, setWallPosts] = useState([]);
//   const [error, setError] = useState('');

//   // Listener for Wall Posts
//   useEffect(() => {
//     // Don't do anything if we don't have a user
//     if (!user) {
//       setWallPosts([]);
//       return;
//     }

//     // Create a list of all UIDs to fetch posts from.
//     // It includes the current user's UID plus the UIDs of all their connections.
//     const connectedUids = [
//       user.uid, 
//       ...connections.map(c => c.requesterUid === user.uid ? c.recipientUid : c.requesterUid)
//     ];
    
//     // If there are no UIDs to query, don't do anything
//     if (connectedUids.length === 0) {
//         setWallPosts([]);
//         return;
//     }

//     // Query for posts where the author is in our list of connected UIDs
//     const postsQuery = query(
//       collection(db, "posts"),
//       where("authorUid", "in", connectedUids),
//       orderBy("createdAt", "desc")
//     );

//     const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
//       const postsData = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setWallPosts(postsData);
//     });

//     // Cleanup the listener when the component unmounts
//     return () => unsubscribe();
//   }, [user, connections]); // Rerun this effect when the user or their connections change


//   // Function for Creating a Post
//   const handleCreatePost = async (e) => {
//     e.preventDefault();
//     if (!newPostContent.trim()) {
//       setError("Post cannot be empty.");
//       return;
//     }
//     setError('');
//     try {
//       await addDoc(collection(db, "posts"), {
//         content: newPostContent,
//         authorUid: user.uid,
//         authorEmail: user.email,
//         createdAt: Timestamp.now(),
//       });
//       setNewPostContent(''); // Clear the textarea after posting
//     } catch (err) {
//       setError("Failed to create post.");
//     }
//   };

//   return (
//     <div className="card">
//       <h2>Family Wall</h2>
//       {error && <p className="error-message">{error}</p>}
//       <form onSubmit={handleCreatePost} className="post-form">
//         <textarea
//           value={newPostContent}
//           onChange={(e) => setNewPostContent(e.target.value)}
//           placeholder="Share a life update..."
//           className="post-textarea"
//           rows="3"
//         ></textarea>
//         <button type="submit" className="auth-button">Post</button>
//       </form>
//       <div className="posts-list">
//         {wallPosts.length > 0 ? (
//           wallPosts.map(post => (
//             <div key={post.id} className="post-item">
//               <p className="post-author"><strong>{post.authorEmail}</strong></p>
//               <p className="post-content">{post.content}</p>
//               <p className="post-time">
//                 {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : 'Just now'}
//               </p>
//             </div>
//           ))
//         ) : (
//           <p>The wall is empty. Be the first to post!</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default FamilyWall;
