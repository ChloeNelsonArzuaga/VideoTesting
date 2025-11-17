import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Picker from './pages/Picker';
import Library from './pages/Library';
import './styles/index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.authenticated) {
        setUser(data.user);
      }

      setLoading(false);
    } catch (err) {
      console.error('[App] Auth check error:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/VideoTesting">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/picker" /> : <Login />} />
        <Route path="/picker" element={user ? <Picker /> : <Navigate to="/" />} />
        <Route path="/library" element={user ? <Library /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
