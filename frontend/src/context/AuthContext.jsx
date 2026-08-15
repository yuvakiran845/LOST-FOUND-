import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * AuthContext — global authentication state for the app.
 *
 * Provides:
 *   user          — the logged-in user object  { id, name, email }  or null
 *   isAuthenticated — boolean derived from user
 *   isLoading     — true while we're checking localStorage on first load
 *   login(token, user) — save token to localStorage, update state
 *   logout()      — clear token from localStorage, reset state
 *
 * On first load:
 *   We check localStorage for an existing token and call GET /api/auth/me
 *   to verify it's still valid. This keeps the user logged in after refresh.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until we check the token

  // ── On App Mount: Restore Session ──────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify token is still valid by hitting the protected /me endpoint
        // The Axios interceptor in api/axios.js automatically sends the token
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch (error) {
        // Token is expired or invalid — clear it
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── login() — called after successful register or login API response ───
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  // ── logout() — clears everything and resets state ─────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — custom hook to consume the AuthContext.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
