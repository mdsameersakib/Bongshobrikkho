import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export default function AddEventModal({ open, onClose, persons }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('gathering');
  const [invitees, setInvitees] = useState([]);
  const [saving, setSaving] = useState(false);
  if (!open) return null;

  const toggleInvitee = (id) => {
    setInvitees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const reset = () => { setTitle(''); setDate(''); setType('gathering'); setInvitees([]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'events'), {
        title,
        date, // YYYY-MM-DD
        type, // classification
        creatorUid: user.uid,
        invitees, // array of personIds (future: map to user accounts)
        createdAt: serverTimestamp()
      });
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to create event', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Create Event</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Family Get Together" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={type} onChange={e=>setType(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="gathering">Gathering</option>
                <option value="wedding">Wedding</option>
                <option value="reunion">Reunion</option>
                <option value="religious">Religious</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-end">
              <button disabled={saving || !title || !date} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-2 rounded-md shadow">{saving ? 'Saving...' : 'Save Event'}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Invite People</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {persons.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={()=>toggleInvitee(p.id)}
                  className={`text-left px-3 py-2 rounded-md border text-sm ${invitees.includes(p.id) ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}`}
                >
                  {p.firstName} {p.lastName || ''}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Invite list stored with event; future: notifications.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
