import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ScanHistory from './components/ScanHistory';
import MonitoringSettings from './components/MonitoringSettings';
import AccessReviews from './components/AccessReviews';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
    // Check auth every minute
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = () => {
    const auth = localStorage.getItem('isAuthenticated');
    const expiry = localStorage.getItem('authExpiry');
    const userData = localStorage.getItem('user');

    if (auth === 'true' && expiry && Date.now() < parseInt(expiry)) {
      setIsAuthenticated(true);
      if (userData) setUser(JSON.parse(userData));
    } else {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authExpiry');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  // Activity tracker (reset expiry on activity)
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateActivity = () => {
      const expiry = localStorage.getItem('authExpiry');
      if (expiry && Date.now() < parseInt(expiry)) {
        // Extend session by 30 mins on activity
        const newExpiry = Date.now() + (30 * 60 * 1000);
        localStorage.setItem('authExpiry', newExpiry.toString());
        localStorage.setItem('lastActivity', Date.now().toString());
      }
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [isAuthenticated]);

  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      {isAuthenticated && <Sidebar user={user} onLogout={handleLogout} />}

      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute adminOnly>
                <ScanHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute adminOnly>
                <MonitoringSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/access-reviews"
            element={
              <ProtectedRoute adminOnly>
                <AccessReviews />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
