import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchReceivedRequests } from '../api/requests';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { setPendingCount(0); return; }
    fetchReceivedRequests()
      .then(({ data }) => {
        const n = (data.requests || []).filter(r => r.status === 'PENDING').length;
        setPendingCount(n);
      })
      .catch(() => {});
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const linkCls = (path) =>
    `text-sm font-medium transition-colors ${
      isActive(path) ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">CampusConnect</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/items"        className={linkCls('/items')}>Browse</Link>
            <Link to="/report/lost"  className={linkCls('/report/lost')}>Report Lost</Link>
            <Link to="/report/found" className={linkCls('/report/found')}>Report Found</Link>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className={linkCls('/dashboard')}>Dashboard</Link>
                <Link to="/requests" className={`${linkCls('/requests')} flex items-center gap-1.5`}>
                  Requests
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-xs font-bold bg-red-500 text-white rounded-full">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden md:block px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Log out
                </button>
                <button
                  className="md:hidden p-2 text-gray-500 hover:text-gray-900"
                  onClick={() => setMenuOpen(o => !o)}
                >
                  {menuOpen ? '✕' : '☰'}
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Log in
                </Link>
                <Link to="/register"
                  className="px-4 py-1.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isAuthenticated && menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white py-2">
          {[
            { to: '/items',        label: 'Browse Items'  },
            { to: '/report/lost',  label: 'Report Lost'   },
            { to: '/report/found', label: 'Report Found'  },
            { to: '/dashboard',    label: 'Dashboard'     },
            { to: '/my-items',     label: 'My Items'      },
            { to: '/requests',     label: 'Requests'      },
            { to: '/admin',        label: 'Admin'         },
            { to: '/profile',      label: 'Profile'       },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
