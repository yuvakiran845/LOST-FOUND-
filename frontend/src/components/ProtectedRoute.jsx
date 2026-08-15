import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * Usage in App.jsx:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *
 * Behaviour:
 *   - While auth is being restored from localStorage: show a loading spinner
 *   - If authenticated: render the children (the actual page)
 *   - If not authenticated: redirect to /login
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't redirect yet — we're still checking if there's a valid token in localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /login — replace:true so the browser back button doesn't go back to the protected page
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
