import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <-- Auth provider
import { ThemeProvider } from './context/ThemeContext'; // <-- Theme provider

import { library } from '@fortawesome/fontawesome-svg-core';
import { faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt, faPlus, faPen, faTrash, faUserPlus, faSearch, faBirthdayCake, faComments, faChevronRight, faThumbsUp, faHeart, faLaughSquint, faTimes } from '@fortawesome/free-solid-svg-icons';
library.add(faTachometerAlt, faUsers, faSitemap, faNewspaper, faCalendarAlt, faPlus, faPen, faTrash, faUserPlus, faSearch, faBirthdayCake, faComments, faChevronRight, faThumbsUp, faHeart, faLaughSquint, faTimes);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);