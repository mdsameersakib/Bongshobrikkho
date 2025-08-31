import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/displayName';
import usePersons from '../hooks/usePersons';
import useFamilyWall from '../hooks/useFamilyWall';
import useCloudinaryUpload from '../hooks/useCloudinaryUpload';
import CommentSection from '../components/CommentSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faEdit, faTrash, faCamera, faThumbsUp, faHeart, faLaughSquint } from '@fortawesome/free-solid-svg-icons';

export default function FamilyWallPage() {
    const { user } = useAuth();
    const { allPersons, userPerson } = usePersons();
    const myName = getDisplayName(user?.uid, user?.email, allPersons);

    const { upload, uploading, error: uploadError } = useCloudinaryUpload();
    
    const {
        posts,
        error: postsError,
        loading,
        createPost,
        handleReaction,
        updatePost,
        deletePost,
    } = useFamilyWall();

    const [newPostContent, setNewPostContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [editingPostId, setEditingPostId] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        // Optional: Add click outside to close menu
        // For now, we'll rely on clicking the menu button to toggle
    }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim() && !imageFile) return;
        let uploadedImageUrl = '';
        if (imageFile) {
            uploadedImageUrl = await upload(imageFile);
            if (!uploadedImageUrl) return;
        }
        await createPost(newPostContent, uploadedImageUrl);
        setNewPostContent('');
        setImageFile(null);
        setImagePreviewUrl('');
        if (document.getElementById('wall-image-input')) {
            document.getElementById('wall-image-input').value = '';
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImagePreviewUrl('');
        }
    };

    const handleEditClick = (post) => {
        setEditingPostId(post.id);
        setEditedContent(post.content);
        setOpenMenuId(null);
    };

    const handleCancelEdit = () => {
        setEditingPostId(null);
        setEditedContent('');
    };

    const handleSaveEdit = async (postId) => {
        await updatePost(postId, editedContent);
        setEditingPostId(null);
        setEditedContent('');
    };

    const handleDeleteClick = (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            deletePost(postId);
        }
        setOpenMenuId(null);
    };

    const getReactionCount = (reactions, type) => {
        if (!reactions) return 0;
        return Object.values(reactions).filter((r) => r === type).length;
    };

    const myAvatarUrl = userPerson?.profileImageUrl || `https://placehold.co/40x40/2c7a7b/ffffff?text=${user?.email?.[0].toUpperCase()}`;
    
    // This function should now work correctly
    const getAuthorAvatar = (authorUid) => {
        const author = allPersons.find(p => p.claimedByUid === authorUid);
        return author?.profileImageUrl || `https://placehold.co/48x48/16a34a/ffffff?text=${(author?.firstName || 'U')[0].toUpperCase()}`;
    }

    return (
        <div className="p-4 md:p-6">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Family Wall</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    See what everyone in the family is up to.
                </p>
            </header>

            {postsError && (
                <p className="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg">
                    {postsError}
                </p>
            )}

            <div className="max-w-3xl mx-auto">
                {user && (
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl shadow-md mb-8">
                        <div className="flex items-start space-x-4">
                            <img src={myAvatarUrl} alt="User Avatar" className="h-10 w-10 rounded-full object-cover" />
                            <textarea className="w-full border-none p-2 text-slate-700 dark:text-slate-200 focus:ring-0 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent" rows="3" placeholder={`What's on your mind, ${myName}?`} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
                        </div>
                        {imagePreviewUrl && (<div className="mt-4 pl-14"><img src={imagePreviewUrl} alt="Preview" className="rounded-lg max-h-60" /></div>)}
                        <div className="flex justify-between items-center mt-3">
                            <div>
                                <label htmlFor="wall-image-input" className="cursor-pointer text-slate-500 hover:text-accent"><FontAwesomeIcon icon={faCamera} className="mr-2" />Add Photo</label>
                                <input id="wall-image-input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                            </div>
                            <button onClick={handleCreatePost} disabled={loading || uploading} className="btn btn-primary font-semibold py-2 px-6 rounded-lg shadow transition-transform transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed">
                                {uploading ? 'Uploading...' : (loading ? 'Posting...' : 'Post')}
                            </button>
                        </div>
                        {uploadError && <p className="text-red-500 text-sm text-right mt-2">{uploadError}</p>}
                    </div>
                )}

                <div className="space-y-8">
                    {posts.map((post) => {
                        const reactions = post.reactions || {};
                        const currentUserReaction = user ? reactions[user.uid] : null;
                        const likeCount = getReactionCount(reactions, 'like');
                        const loveCount = getReactionCount(reactions, 'love');
                        const hahaCount = getReactionCount(reactions, 'haha');
                        const isEditing = editingPostId === post.id;

                        return (
                            <div key={post.id} className="bg-white dark:bg-slate-950 p-6 rounded-xl shadow-md">
                                <div className="flex items-center mb-4">
                                    <img 
                                        // --- THIS IS THE FIX ---
                                        // Was: post.authorId
                                        // Now: post.authorUid
                                        src={getAuthorAvatar(post.authorUid)} 
                                        alt={post.authorName || post.authorEmail} 
                                        className="h-12 w-12 rounded-full object-cover" 
                                    />
                                    <div className="ml-4">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{post.authorName || post.authorEmail}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : 'Just now'}</p>
                                    </div>
                                    {user && user.uid === post.authorUid && !isEditing && (
                                        <div className="ml-auto relative">
                                            <button 
                                                onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} 
                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                aria-label="Post options"
                                            >
                                                <FontAwesomeIcon icon={faEllipsisH} />
                                            </button>
                                            {openMenuId === post.id && (
                                                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg z-20 border border-slate-200 dark:border-slate-700">
                                                    <button 
                                                        onClick={() => handleEditClick(post)} 
                                                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-md transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="mr-2" />Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(post.id)} 
                                                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-md transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="mr-2" />Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {isEditing ? (
                                    <div>
                                        <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full border rounded-md p-2 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" rows="4" />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button onClick={handleCancelEdit} className="btn text-sm">Cancel</button>
                                            <button onClick={() => handleSaveEdit(post.id)} className="btn btn-primary text-sm">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {post.content && (<p className="text-slate-700 dark:text-slate-200 mb-4 whitespace-pre-wrap">{post.content}</p>)}
                                        {post.imageUrl && (<div className="mb-4"><img src={post.imageUrl} alt="Post content" className="rounded-lg w-full object-cover" /></div>)}
                                    </>
                                )}

                                {!isEditing && user && (
                                    <div className="flex items-center space-x-4 border-t border-slate-200 dark:border-slate-800 pt-2">
                                        <button onClick={() => handleReaction(post.id, 'like')} className={`reaction-btn text-sm flex items-center space-x-2 transition-colors ${currentUserReaction === 'like' ? 'text-blue-600 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600'}`}>
                                            <FontAwesomeIcon icon={faThumbsUp} /><span>Like {likeCount > 0 && `(${likeCount})`}</span>
                                        </button>
                                        <button onClick={() => handleReaction(post.id, 'love')} className={`reaction-btn text-sm flex items-center space-x-2 transition-colors ${currentUserReaction === 'love' ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-red-500'}`}>
                                            <FontAwesomeIcon icon={faHeart} /><span>Love {loveCount > 0 && `(${loveCount})`}</span>
                                        </button>
                                        <button onClick={() => handleReaction(post.id, 'haha')} className={`reaction-btn text-sm flex items-center space-x-2 transition-colors ${currentUserReaction === 'haha' ? 'text-yellow-500 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-yellow-500'}`}>
                                            <FontAwesomeIcon icon={faLaughSquint} /><span>Haha {hahaCount > 0 && `(${hahaCount})`}</span>
                                        </button>
                                    </div>
                                )}
                                {!isEditing && <CommentSection postId={post.id} />}
                            </div>
                        );
                    })}
                    {posts.length === 0 && !loading && (
                        <p className="text-center text-slate-500 dark:text-slate-400">The wall is empty. Be the first to post!</p>
                    )}
                </div>
            </div>
        </div>
    );
}