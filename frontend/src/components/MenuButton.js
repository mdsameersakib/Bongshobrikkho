import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function MenuButton({ isOpen, onClick }) {
  return (
    <button onClick={onClick} className="md:hidden p-2 text-gray-600 hover:text-teal-700">
      <FontAwesomeIcon icon={isOpen ? faTimes : faBars} size="lg" />
    </button>
  );
}