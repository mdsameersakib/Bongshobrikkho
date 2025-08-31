import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AppErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <-- Auth provider
import { ThemeProvider } from './context/ThemeContext'; // <-- Theme provider
import { ToastProvider } from './context/ToastContext'; // <-- Toast provider

import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faTachometerAlt, 
  faUsers, 
  faSitemap, 
  faNewspaper, 
  faCalendarAlt, 
  faPlus, 
  faPen, 
  faTrash, 
  faUserPlus, 
  faSearch, 
  faBirthdayCake, 
  faComments, 
  faChevronRight, 
  faThumbsUp, 
  faHeart, 
  faLaughSquint, 
  faTimes,
  faEllipsisH,
  faEdit,
  faCamera,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
  faRedo
} from '@fortawesome/free-solid-svg-icons';
library.add(
  faTachometerAlt, 
  faUsers, 
  faSitemap, 
  faNewspaper, 
  faCalendarAlt, 
  faPlus, 
  faPen, 
  faTrash, 
  faUserPlus, 
  faSearch, 
  faBirthdayCake, 
  faComments, 
  faChevronRight, 
  faThumbsUp, 
  faHeart, 
  faLaughSquint, 
  faTimes,
  faEllipsisH,
  faEdit,
  faCamera,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
  faRedo
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);