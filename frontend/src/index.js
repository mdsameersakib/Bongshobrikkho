import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <-- Import the provider

import { library } from '@fortawesome/fontawesome-svg-core';
import { faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt, faPlus, faPen, faTrash, faUserPlus, faSearch, faBirthdayCake, faComments, faChevronRight, faThumbsUp, faHeart, faLaughSquint, faTimes } from '@fortawesome/free-solid-svg-icons';
library.add(faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt, faPlus, faPen, faTrash, faUserPlus, faSearch, faBirthdayCake, faComments, faChevronRight, faThumbsUp, faHeart, faLaughSquint, faTimes);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* <-- Wrap the App component */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);