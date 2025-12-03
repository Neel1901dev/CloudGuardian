import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const authExpiry = localStorage.getItem('authExpiry');
    const now = Date.now();

    // Check if auth token expired
    if (isAuthenticated && authExpiry && now > parseInt(authExpiry)) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        localStorage.removeItem('authExpiry');
        localStorage.removeItem('lastActivity');
        return <Navigate to="/login" replace />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
