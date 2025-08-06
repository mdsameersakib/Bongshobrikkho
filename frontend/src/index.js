import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // This now contains our Tailwind styles
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// --- NEW FONT AWESOME IMPORTS AND CONFIGURATION ---
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt, // For Sidebar
  faPlus, faPen, faTrash, faUserPlus, faSearch, // For Family List & Search
  faBirthdayCake, faComments, faChevronRight, // For Dashboard stats & previews
  faThumbsUp, faHeart, faLaughSquint, // For Family Wall reactions
  faTimes // For Modals
} from '@fortawesome/free-solid-svg-icons'; // We are using solid icons for now

// Add the imported icons to the library so they can be used throughout the app
library.add(
  faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt,
  faPlus, faPen, faTrash, faUserPlus, faSearch,
  faBirthdayCake, faComments, faChevronRight,
  faThumbsUp, faHeart, faLaughSquint,
  faTimes
);
// --- END NEW FONT AWESOME IMPORTS AND CONFIGURATION ---

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
