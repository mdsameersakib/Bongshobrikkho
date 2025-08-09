import React, { useEffect, useState, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import usePersons from '../hooks/usePersons';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { updateUserProfile } from '../services/profileService';

// Settings page: profile edit, appearance (theme + accent), account/logout, preference persistence
function SettingsPage() {
	const { user } = useAuth();
	const { userPerson } = usePersons();
	const { mode, setMode, accent, setAccent, accents } = useTheme();

	// Profile form state
	const [profile, setProfile] = useState({ firstName: '', lastName: '', birthDate: '' });
	const [savingProfile, setSavingProfile] = useState(false);
	const [profileStatus, setProfileStatus] = useState('');

	// Preference load state
	const [prefStatus, setPrefStatus] = useState('');
	const loadingPrefsRef = useRef(true); // prevent immediate write back on initial load
	const debounceTimer = useRef(null);

	// Load profile fields when person data available
	useEffect(() => {
		if (userPerson) {
			setProfile({
				firstName: userPerson.firstName || '',
				lastName: userPerson.lastName || '',
				birthDate: userPerson.birthDate || ''
			});
		}
	}, [userPerson]);

	// Load stored preferences (theme + accent) from users doc.preferences (one-time per mount)
	useEffect(() => {
		(async () => {
			if (!user) return;
			try {
				const userRef = doc(db, 'users', user.uid);
				const snap = await getDoc(userRef);
				if (snap.exists()) {
					const data = snap.data();
						if (data.preferences) {
							const { themeMode, accent: savedAccent } = data.preferences;
							if (themeMode && ['light','dark','system'].includes(themeMode)) setMode(themeMode);
							if (savedAccent && accents.includes(savedAccent)) setAccent(savedAccent);
						}
				}
			} catch (e) {
				console.warn('Failed loading preferences', e);
			} finally {
				loadingPrefsRef.current = false;
			}
		})();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	// Persist preferences (debounced) when mode or accent changes after initial load
	useEffect(() => {
		if (!user) return;
		if (loadingPrefsRef.current) return; // skip initial sync
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(async () => {
			try {
				const userRef = doc(db, 'users', user.uid);
				await updateDoc(userRef, { preferences: { themeMode: mode, accent } });
				setPrefStatus('Preferences saved');
				setTimeout(() => setPrefStatus(''), 2000);
			} catch (e) {
				// If user doc somehow missing, create it minimal
				try {
					await setDoc(doc(db,'users', user.uid), { uid: user.uid, email: user.email, preferences: { themeMode: mode, accent } }, { merge: true });
					setPrefStatus('Preferences saved');
					setTimeout(() => setPrefStatus(''), 2000);
				} catch (err) {
					console.error('Failed saving preferences', err);
					setPrefStatus('Pref save failed');
				}
			}
		}, 500);
		return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
	}, [mode, accent, user]);

	const onProfileField = (field, value) => setProfile(p => ({ ...p, [field]: value }));

	const saveProfile = async () => {
		if (!user || !userPerson) return;
		setSavingProfile(true); setProfileStatus('');
		try {
			await updateUserProfile({ personId: userPerson.id, ...profile });
			// Also mirror displayName to users doc
			await updateDoc(doc(db, 'users', user.uid), { displayName: profile.firstName || user.email.split('@')[0] });
			setProfileStatus('Saved');
		} catch (e) {
			console.error(e); setProfileStatus('Save failed');
		} finally {
			setSavingProfile(false);
			setTimeout(() => setProfileStatus(''), 2500);
		}
	};

	const logout = async () => { await signOut(auth); };

	return (
		<div className="max-w-5xl mx-auto space-y-10">
			{/* Header */}
			<header className="flex items-center justify-between flex-wrap gap-4">
				<div>
					<h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
					<p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage profile, appearance & account preferences.</p>
				</div>
			</header>

			{/* Profile Section */}
			<section className="card p-6 space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Profile</h2>
					{profileStatus && <span className="text-xs text-slate-500 dark:text-slate-400">{profileStatus}</span>}
				</div>
				<p className="text-xs text-slate-500 dark:text-slate-500">These details appear across your family tree.</p>
				<div className="grid gap-6 md:grid-cols-3">
					<div className="space-y-4 md:col-span-2">
						<div>
							<label className="block text-xs font-medium mb-1 uppercase tracking-wide text-slate-500">First Name</label>
							<input className="input" value={profile.firstName} onChange={e=>onProfileField('firstName', e.target.value)} />
						</div>
						<div>
							<label className="block text-xs font-medium mb-1 uppercase tracking-wide text-slate-500">Last Name</label>
							<input className="input" value={profile.lastName} onChange={e=>onProfileField('lastName', e.target.value)} />
						</div>
						<div>
							<label className="block text-xs font-medium mb-1 uppercase tracking-wide text-slate-500">Birth Date</label>
							<input type="date" className="input" value={profile.birthDate} onChange={e=>onProfileField('birthDate', e.target.value)} />
						</div>
						<div className="pt-2 flex gap-3 items-center">
							<button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary disabled:opacity-50">{savingProfile? 'Saving...' : 'Save Profile'}</button>
						</div>
					</div>
					<div className="flex md:col-span-1 items-center justify-center">
						<div className="h-32 w-32 rounded-full bg-accent/20 flex items-center justify-center text-4xl font-bold text-accent select-none">
							{(profile.firstName || user?.email || 'U')[0]?.toUpperCase()}
						</div>
					</div>
				</div>
			</section>

			{/* Appearance Section */}
			<section className="card p-6 space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Appearance</h2>
					{prefStatus && <span className="text-xs text-slate-500 dark:text-slate-400">{prefStatus}</span>}
				</div>
				<div className="grid gap-8 md:grid-cols-2">
					<div>
						<p className="text-xs font-medium mb-2 uppercase tracking-wide text-slate-500 dark:text-slate-400">Theme Mode</p>
						<div className="inline-flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-600">
							{['light','dark','system'].map(m => (
								<button key={m} onClick={()=>setMode(m)} className={`px-4 py-2 text-sm font-medium capitalize ${mode===m? 'bg-accent text-accent-foreground':'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{m}</button>
							))}
						</div>
					</div>
					<div>
						<p className="text-xs font-medium mb-2 uppercase tracking-wide text-slate-500 dark:text-slate-400">Accent Color</p>
						<div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Accent color">
							{accents.map(a => (
								<button
									key={a}
									role="radio"
									aria-checked={accent===a}
									aria-label={a}
									onClick={()=>setAccent(a)}
									className={`h-10 w-10 rounded-full flex items-center justify-center ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 transition ${accent===a? 'ring-2 ring-accent':''}`}
									style={accentStyleInline(a)}
									data-accent={a}
								>
									{accent===a && <span className="text-xs font-bold text-accent-foreground">✓</span>}
								</button>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Account Section */}
			<section className="card p-6 space-y-4">
				<h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Account</h2>
				<p className="text-xs text-slate-500 dark:text-slate-400">Signed in as <span className="font-medium">{user?.email}</span></p>
				<div className="flex gap-3">
					<button onClick={logout} className="btn bg-rose-600 hover:bg-rose-700 text-white">Logout</button>
				</div>
			</section>
		</div>
	);
}

// Accent circle inline style (preview) using same RGB table as ThemeContext
function accentStyleInline(a) {
	const map = {
		teal: '13 148 136',
		emerald: '16 185 129',
		indigo: '79 70 229',
		violet: '139 92 246',
		rose: '244 63 94',
		amber: '217 119 6',
		sky: '2 132 199',
		cyan: '14 116 144',
		lime: '101 163 13',
		orange: '234 88 12',
		fuchsia: '192 38 211',
		slate: '71 85 105'
	};
	const rgb = map[a] || map.teal;
	return { '--accent': rgb, backgroundColor: `rgb(${rgb})` };
}

export default SettingsPage;
