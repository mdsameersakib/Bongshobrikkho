import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const MobileSidebarLink = ({ to, icon, children, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `flex items-center p-4 text-lg ${isActive ? 'bg-teal-700 text-white' : 'text-gray-700'}`}
    >
      <FontAwesomeIcon icon={icon} className="w-6 mr-4" />
      <span>{children}</span>
    </NavLink>
  );
};

export default function MobileSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar Panel */}
      <div 
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-teal-700">BongshoBrikkho</h1>
        </div>
        <nav className="mt-6">
          <MobileSidebarLink to="/dashboard" icon={faTachometerAlt} onClick={onClose}>Dashboard</MobileSidebarLink>
          <MobileSidebarLink to="/family-list" icon={faUsers} onClick={onClose}>Family List</MobileSidebarLink>
          <MobileSidebarLink to="/family-tree" icon={faSitemap} onClick={onClose}>Family Tree</MobileSidebarLink>
          <MobileSidebarLink to="/family-wall" icon={faNewspaper} onClick={onClose}>Family Wall</MobileSidebarLink>
          <MobileSidebarLink to="/events" icon={faCalendarAlt} onClick={onClose}>Events</MobileSidebarLink>
        </nav>
      </div>
    </>
  );
}