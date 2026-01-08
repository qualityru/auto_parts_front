import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import UserProfile from './components/UserProfile';
import ProtectedRoute from './ProtectedRoute'; // импортируем защитника

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        
        {/* Теперь профиль доступен ТОЛЬКО если токен живой */}
        <Route 
          path="/profile" 
          element={
            // <ProtectedRoute>
              <UserProfile />
            // </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  </React.StrictMode>
);