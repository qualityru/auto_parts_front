import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import UserProfile from './components/UserProfile';
import InfoPage from './pages/InfoPage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search" element={<App />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/delivery" element={<InfoPage pageKey="delivery" />} />
        <Route path="/payment" element={<InfoPage pageKey="payment" />} />
        <Route path="/returns" element={<InfoPage pageKey="returns" />} />
        <Route path="/about" element={<InfoPage pageKey="about" />} />
        <Route path="/contacts" element={<InfoPage pageKey="contacts" />} />
        <Route path="/partners" element={<InfoPage pageKey="partners" />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
