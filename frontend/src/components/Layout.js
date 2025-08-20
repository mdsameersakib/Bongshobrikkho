import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePersons from '../hooks/usePersons';
import { getDisplayName } from '../utils/displayName';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

// Import our new mobile components
import MobileSidebar from './MobileSidebar';
import MenuButton from './MenuButton';

const SidebarLink = ({ to, children, emoji }) => {
  const linkClasses = "flex items-center p-3 my-1 rounded-lg font-medium transition-colors duration-150 text-slate-600 dark:text-slate-300";
  // Active: neutral surface (white / dark) with accent left bar & subtle shadow for contrast against accent-tinted background
  const activeLinkClasses = "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow border-l-4 border-accent";
  const hoverClasses = "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white";

  return (
    <NavLink to={to} className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses}`}>
  <span className="mr-3 text-lg leading-none" aria-hidden="true">{emoji}</span>
  <span className="truncate">{children}</span>
    </NavLink>
  );
};

export default function Layout({ handleLogout }) {
  const { user } = useAuth();
  const { allPersons, userPerson } = usePersons();
  const displayName = getDisplayName(user?.uid, user?.email, allPersons);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { resolvedMode, toggleMode } = useTheme();

  // Use user's profile image if available
  const userProfileImage = userPerson?.profileImageUrl;

  return (
  <div className="app-shell flex h-screen font-sans bg-slate-50 dark:bg-slate-900 text-black dark:text-white transition-colors">
      {/* --- Desktop Sidebar (Hidden on small screens) --- */}
  <aside className="hidden md:flex md:w-64 bg-white dark:bg-slate-950 sidebar-accent shadow-lg flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-accent">BongshoBrikkho</h1>
        </div>
        <nav className="mt-6 px-4 flex-1">
      <SidebarLink to="/dashboard" emoji="📊">Dashboard</SidebarLink>
      <SidebarLink to="/family-list" emoji="👨‍👩‍👧‍👦">Family List</SidebarLink>
      <SidebarLink to="/family-tree" emoji="🌳">Family Tree</SidebarLink>
      <SidebarLink to="/family-wall" emoji="🗞️">Family Wall</SidebarLink>
    <SidebarLink to="/events" emoji="🎉">Events</SidebarLink>
    <SidebarLink to="/settings" emoji="⚙️">Settings</SidebarLink>
        </nav>
    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center">
        {userProfileImage ? (
          <img
            src={userProfileImage}
            alt="User Avatar"
            className="rounded-full h-10 w-10 object-cover"
          />
        ) : (
          <img
            src={`https://placehold.co/40x40/2c7a7b/ffffff?text=${displayName?.[0] || 'U'}`}
            alt="User Avatar"
            className="rounded-full h-10 w-10"
          />
        )}
        <div className="ml-3">
          <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">{displayName}</p>
          <button onClick={toggleMode} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1">{resolvedMode==='dark'? <><FontAwesomeIcon icon={faSun}/> Light</>:<><FontAwesomeIcon icon={faMoon}/> Dark</>} Mode</button>
        </div>
      </div>
    </div>
      </aside>

      {/* --- Mobile Sidebar (Managed by state) --- */}
      <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col">
        {/* Top bar for mobile, with menu button */}
        <header className="md:hidden bg-white dark:bg-slate-950 shadow-md p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
           <h1 className="text-xl font-bold text-accent">BongshoBrikkho</h1>
           <div className="flex items-center gap-3">
             <button onClick={toggleMode} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
               <FontAwesomeIcon icon={resolvedMode==='dark'? faSun : faMoon} />
             </button>
             <MenuButton isOpen={isMobileSidebarOpen} onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)} />
           </div>
        </header>

  <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <Outlet /> {/* Child pages will be rendered here */}
        </main>
      </div>
    </div>
  );
}