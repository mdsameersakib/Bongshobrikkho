import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // <-- Import useAuth

// Import our custom hooks
import usePersons from '../hooks/usePersons';
import useEvents from '../hooks/useEvents';
import useCategorizedEvents from '../hooks/useCategorizedEvents';
import useCouples from '../hooks/useCouples';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { formatDateDMY } from '../utils/date';
import { db } from '../services/firebase';
import AddEventModal from '../components/AddEventModal';

// Using shared date util
const formatDate = formatDateDMY;

export default function EventsPage() {
    const { user } = useAuth(); // <-- Get user from context
    const [showModal, setShowModal] = useState(false);

    // --- REFACTORED: Hooks called without arguments ---
    const { allPersons } = usePersons();
    const { customEvents } = useEvents();
    const { couples } = useCouples();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title:'', date:'', type:'' });
    const [savingEdit, setSavingEdit] = useState(false);

    // Process all data with our logic hook
    const { upcoming, later, remembrance } = useCategorizedEvents(allPersons, customEvents, couples, user);

    const beginEdit = (ev) => {
        // ev may be raw custom event (from customEvents list) or enriched categorized event (with ev.raw)
        const raw = ev.raw || ev; // fallback to itself
        setEditingId(raw.id);
        setEditForm({ title: raw.title, date: raw.date, type: raw.type });
    };
    const cancelEdit = ()=> { setEditingId(null); };
    const saveEdit = async () => {
        if (!editingId) return; setSavingEdit(true);
        try {
            await updateDoc(doc(db,'events', editingId), { ...editForm });
            setEditingId(null);
        } catch(e){ console.error('Update failed', e); }
        finally { setSavingEdit(false); }
    };
    const removeEvent = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try { await deleteDoc(doc(db,'events', id)); } catch(e){ console.error('Delete failed', e); }
    };

    // Helpers for styling per event type
    const typeMeta = (type) => {
        switch(type){
            case 'birthday': return { border:'border-blue-500', bg:'bg-blue-50 dark:bg-blue-900/30', emoji:'🎂' };
            case 'anniversary': return { border:'border-amber-500', bg:'bg-amber-50 dark:bg-amber-900/30', emoji:'💍' };
            case 'custom': return { border:'border-pink-500', bg:'bg-pink-50 dark:bg-pink-900/30', emoji:'🎈' };
            case 'remembrance': return { border:'border-purple-500', bg:'bg-violet-50 dark:bg-violet-900/30', emoji:'🕯️' };
            default: return { border:'border-slate-400', bg:'bg-slate-50 dark:bg-slate-800/30', emoji:'📌' };
        }
    };

    // Render the UI
    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Family Events</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Keep track of important dates and milestones.</p>
                </div>
                <button onClick={()=>setShowModal(true)} className="btn btn-primary font-semibold py-2 px-4 shadow">
                    <i className="fas fa-plus mr-2"></i>Add New Event
                </button>
            </header>

            <div className="space-y-10">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-4">
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-blue-500 rounded-sm"></span><span role="img" aria-label="Birthday">🎂</span> Birthday</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-amber-500 rounded-sm"></span><span role="img" aria-label="Anniversary">💍</span> Anniversary</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-pink-500 rounded-sm"></span><span role="img" aria-label="Event">🎈</span> Custom Event</span>
                </div>
                {/* Upcoming Events Section (includes birthdays, anniversaries, custom) */}
                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Upcoming in the next 30 days</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcoming.map((event) => {
                            const isCustom = event.type === 'custom';
                            const raw = event.raw || event; // raw custom event doc
                            const isOwner = isCustom && raw.creatorUid === user?.uid;
                            const isEditing = isCustom && editingId === raw.id;
                            const meta = typeMeta(event.type);
                            const cardBorder = meta.border;
                            if (isEditing) {
                                return (
                                    <div key={raw.id} className={`relative ${meta.bg} p-5 rounded-xl shadow-md border-l-4 ${cardBorder}`}>
                                        <div className="absolute top-2 right-3 text-3xl select-none" aria-hidden="true">{meta.emoji}</div>
                                        <div className="space-y-2">
                                            <input className="w-full border px-2 py-1 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} />
                                            <div className="flex gap-2">
                                                <input type="date" className="flex-1 border px-2 py-1 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={editForm.date} onChange={e=>setEditForm(f=>({...f,date:e.target.value}))} />
                                                <select className="border px-2 py-1 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={editForm.type} onChange={e=>setEditForm(f=>({...f,type:e.target.value}))}>
                                                    <option value="gathering">Gathering</option>
                                                    <option value="wedding">Wedding</option>
                                                    <option value="reunion">Reunion</option>
                                                    <option value="religious">Religious</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={cancelEdit} type="button" className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100">Cancel</button>
                                                <button disabled={savingEdit} onClick={saveEdit} type="button" className="btn btn-primary px-3 py-1 text-sm disabled:opacity-50">{savingEdit?'Saving...':'Save'}</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={raw.id || event.personName} className={`relative ${meta.bg} p-5 rounded-xl shadow-md border-l-4 ${cardBorder}`}>
                                    <div className="absolute top-2 right-3 text-3xl select-none" aria-hidden="true">{meta.emoji}</div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{event.personName}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(event.displayDate || event.date)}</p>
                                    {event.type === 'anniversary' && event.years != null && (
                                        <p className="text-xs text-amber-600 mt-1">{event.years} year{event.years === 1 ? '' : 's'}</p>
                                    )}
                                    {isCustom && (
                                        <div className="flex gap-2 items-center mt-3">
                                            <span className="text-xs uppercase tracking-wide text-slate-400">{raw.type}</span>
                                            {isOwner && (
                                                <div className="ml-auto flex gap-2">
                                                    <button onClick={()=>beginEdit(raw)} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Edit</button>
                                                    <button onClick={()=>removeEvent(raw.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {upcoming.length === 0 && <p className="text-slate-500 dark:text-slate-400">No events in the next 30 days.</p>}
                    </div>
                </div>

                {/* Later This Year Section */}
                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Later This Year</h3>
                    <div className="space-y-4">
                        {later.map(event => {
                            const isCustom = event.type === 'custom';
                            const raw = event.raw || event;
                            const isOwner = isCustom && raw.creatorUid === user?.uid;
                            const isEditing = isCustom && editingId === raw.id;
                            const meta = typeMeta(event.type);
                            if (isEditing) {
                                return (
                                    <div key={raw.id} className={`relative ${meta.bg} p-4 rounded-lg hover:shadow-lg transition-shadow border-l-4 ${meta.border}`}>
                                        <div className="absolute top-2 right-3 text-3xl select-none" aria-hidden="true">{meta.emoji}</div>
                                        <div className="space-y-2">
                                            <input className="w-full border px-2 py-1 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} />
                                            <div className="flex gap-2">
                                                <input type="date" className="flex-1 border px-2 py-1 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={editForm.date} onChange={e=>setEditForm(f=>({...f,date:e.target.value}))} />
                                                <select className="border px-2 py-1 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" value={editForm.type} onChange={e=>setEditForm(f=>({...f,type:e.target.value}))}>
                                                    <option value="gathering">Gathering</option>
                                                    <option value="wedding">Wedding</option>
                                                    <option value="reunion">Reunion</option>
                                                    <option value="religious">Religious</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                        <button onClick={cancelEdit} type="button" className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100">Cancel</button>
                        <button disabled={savingEdit} onClick={saveEdit} type="button" className="btn btn-primary px-3 py-1 text-sm disabled:opacity-50">{savingEdit?'Saving...':'Save'}</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                <div key={raw.id || event.personName} className={`relative ${meta.bg} p-4 rounded-lg flex items-center justify-between hover:shadow-lg transition-shadow border-l-4 ${meta.border}`}>
                                    <div className="absolute top-2 right-3 text-3xl select-none" aria-hidden="true">{meta.emoji}</div>
                                    <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{event.personName}</p>
                    {isCustom && <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{raw.type}</p>}
                                    </div>
                                    <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(event.displayDate || event.date)}</p>
                                        {isCustom && isOwner && (
                                            <div className="flex gap-2 justify-end mt-2">
                                                <button onClick={()=>beginEdit(raw)} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Edit</button>
                                                <button onClick={()=>removeEvent(raw.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Delete</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
            {later.length === 0 && <p className="text-slate-500 dark:text-slate-400">No other events scheduled this year.</p>}
                    </div>
                </div>

                {/* Days of Remembrance Section */}
                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">In Loving Memory</h3>
                    <div className="space-y-4">
            {remembrance.map((event, index) => (
        <div key={index} className={`relative ${typeMeta('remembrance').bg} p-4 rounded-lg flex items-center justify-between hover:shadow-lg transition-shadow border-l-4 ${typeMeta('remembrance').border}`}>
                <div className="absolute top-2 right-3 text-3xl select-none" aria-hidden="true">{typeMeta('remembrance').emoji}</div>
                                <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{event.personName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Remembrance Day</p>
                                </div>
                                <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(event.date)}</p>
                    <p className="text-xs text-slate-400">{event.lifespan}</p>
                                </div>
                            </div>
                        ))}
            {remembrance.length === 0 && <p className="text-slate-500 dark:text-slate-400">No remembrance days recorded.</p>}
                    </div>
                </div>
            </div>
            <AddEventModal open={showModal} onClose={()=>setShowModal(false)} persons={allPersons || []} />
        </>
    );
}