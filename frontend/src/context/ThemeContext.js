import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ThemeContext = createContext();

const ACCENTS = ['teal','emerald','indigo','violet','rose','amber','sky','cyan','lime','orange','fuchsia','slate'];

function getInitialMode() {
  const stored = localStorage.getItem('bb:themeMode');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}
function getInitialAccent() {
  const stored = localStorage.getItem('bb:accent');
  if (stored && ACCENTS.includes(stored)) return stored;
  return 'teal';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);
  const [accent, setAccent] = useState(getInitialAccent);
  const [resolvedMode, setResolvedMode] = useState('light');
  const remoteSyncedRef = useRef(false);
  const { user } = useAuth();

  // Resolve system preference when needed
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const effective = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
      setResolvedMode(effective);
      if (effective === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    apply();
    if (mode === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [mode]);

  // Apply accent attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  // One-time remote preference sync when user logs in (prevents Settings page from suddenly flipping theme)
  useEffect(() => {
    if (!user) return;
    if (remoteSyncedRef.current) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const prefs = snap.data().preferences;
          if (prefs) {
            const { themeMode, accent: savedAccent } = prefs;
            if (themeMode && ['light','dark','system'].includes(themeMode)) setMode(themeMode);
            if (savedAccent && ACCENTS.includes(savedAccent)) setAccent(savedAccent);
          }
        }
      } catch (e) {
        console.warn('Pref sync failed', e);
      } finally {
        remoteSyncedRef.current = true; // ensure we don't re-run
      }
    })();
  }, [user]);

  // Persistence
  useEffect(() => { localStorage.setItem('bb:themeMode', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('bb:accent', accent); }, [accent]);

  const value = {
    mode,
    setMode,
    accent,
    setAccent,
    accents: ACCENTS,
    resolvedMode,
    toggleMode: useCallback(() => setMode(m => m === 'dark' ? 'light' : 'dark'), [])
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
