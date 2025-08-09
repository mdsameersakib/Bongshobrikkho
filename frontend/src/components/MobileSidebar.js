import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePersons from '../hooks/usePersons';
import { getDisplayName } from '../utils/displayName';

const MobileSidebarLink = ({ to, emoji, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `flex items-center p-3 my-0.5 rounded-lg font-medium text-sm transition-colors ${isActive ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow border-l-4 border-accent' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
  >
    <span className="text-lg mr-3 leading-none" aria-hidden="true">{emoji}</span>
    <span className="truncate">{children}</span>
  </NavLink>
);

export default function MobileSidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { allPersons } = usePersons();
  const displayName = getDisplayName(user?.uid, user?.email, allPersons);
  return (
    <>
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-xl z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-accent">BongshoBrikkho</h1>
        </div>
        <nav className="px-4 flex-1 flex flex-col gap-1 overflow-y-auto pb-4">
          <MobileSidebarLink to="/dashboard" emoji="📊" onClick={onClose}>Dashboard</MobileSidebarLink>
          <MobileSidebarLink to="/family-list" emoji="👨‍👩‍👧‍👦" onClick={onClose}>Family List</MobileSidebarLink>
          <MobileSidebarLink to="/family-tree" emoji="🌳" onClick={onClose}>Family Tree</MobileSidebarLink>
          <MobileSidebarLink to="/family-wall" emoji="🗞️" onClick={onClose}>Family Wall</MobileSidebarLink>
          <MobileSidebarLink to="/events" emoji="🎉" onClick={onClose}>Events</MobileSidebarLink>
          <MobileSidebarLink to="/settings" emoji="⚙️" onClick={onClose}>Settings</MobileSidebarLink>
        </nav>
  {user && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full accent-surface flex items-center justify-center text-sm font-semibold text-black dark:text-white border border-black/5 dark:border-white/10">
    {(displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0">
    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400">Online</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}