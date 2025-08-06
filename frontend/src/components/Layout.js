import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

// A helper component for our sidebar links to handle the "active" state styling
const SidebarLink = ({ to, icon, children }) => {
  const linkClasses = "flex items-center p-3 my-1 rounded-lg text-gray-600 font-medium transition-all duration-200";
  const activeLinkClasses = "bg-teal-700 text-white shadow-lg";
  const hoverClasses = "hover:bg-gray-200 hover:text-gray-800";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${linkClasses} ${isActive ? activeLinkClasses : hoverClasses}`
      }
    >
      <FontAwesomeIcon icon={icon} className="w-5 mr-4 text-center" />
      <span>{children}</span>
    </NavLink>
  );
};

const Layout = ({ user, handleLogout }) => {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col">
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
              src={`https://placehold.co/40x40/2c7a7b/ffffff?text=${user?.email?.[0].toUpperCase()}`} 
              alt="User Avatar" 
              className="rounded-full h-10 w-10"
            />
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
              <button onClick={handleLogout} className="text-xs text-red-600 hover:underline">Logout</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* The Outlet is where React Router will render the specific page component */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;