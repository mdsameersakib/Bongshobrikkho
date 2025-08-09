import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePersons from '../hooks/usePersons';
import { getDisplayName } from '../utils/displayName';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

// Import our new mobile components
import MobileSidebar from './MobileSidebar';
import MenuButton from './MenuButton';

const SidebarLink = ({ to, icon, children }) => {
  const linkClasses = "flex items-center p-3 my-1 rounded-lg text-gray-600 font-medium transition-all duration-200";
  const activeLinkClasses = "bg-teal-700 text-white shadow-lg";
  const hoverClasses = "hover:bg-gray-200 hover:text-gray-800";

  return (
    <NavLink to={to} className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses}`}>
      <FontAwesomeIcon icon={icon} className="w-5 mr-4 text-center" />
      <span>{children}</span>
    </NavLink>
  );
};

export default function Layout({ handleLogout }) {
  const { user } = useAuth();
  const { allPersons } = usePersons();
  const displayName = getDisplayName(user?.uid, user?.email, allPersons);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* --- Desktop Sidebar (Hidden on small screens) --- */}
      <aside className="hidden md:flex md:w-64 bg-white shadow-lg flex-shrink-0 flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-teal-700">BongshoBrikkho</h1>
        </div>
        <nav className="mt-6 px-4 flex-1">
          <SidebarLink to="/dashboard" icon={faTachometerAlt}>Dashboard</SidebarLink>
          <SidebarLink to="/family-list" icon={faUsers}>Family List</SidebarLink>
          <SidebarLink to="/family-tree" icon={faSitemap}>Family Tree</SidebarLink>
          <SidebarLink to="/family-wall" icon={faNewspaper}>Family Wall</SidebarLink>
          <SidebarLink to="/events" icon={faCalendarAlt}>Events</SidebarLink>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <img 
              src={`https://placehold.co/40x40/2c7a7b/ffffff?text=${displayName?.[0] || 'U'}`} 
              alt="User Avatar" 
              className="rounded-full h-10 w-10"
            />
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
              <button onClick={handleLogout} className="text-xs text-red-600 hover:underline">Logout</button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Mobile Sidebar (Managed by state) --- */}
      <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col">
        {/* Top bar for mobile, with menu button */}
        <header className="md:hidden bg-white shadow-md p-4 flex justify-between items-center">
           <h1 className="text-xl font-bold text-teal-700">BongshoBrikkho</h1>
           <MenuButton isOpen={isMobileSidebarOpen} onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)} />
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <Outlet /> {/* Child pages will be rendered here */}
        </main>
      </div>
    </div>
  );
}