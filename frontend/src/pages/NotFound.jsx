import { Link, useNavigate } from 'react-router-dom';

/**
 * NotFound — polished 404 page with navigation helpers.
 */
function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">

      {/* Giant 404 */}
      <div className="relative mb-6">
        <div className="text-[9rem] font-extrabold text-gray-100 leading-none select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl">🔍</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Page not found
      </h1>
      <p className="text-sm text-gray-500 mb-8 max-w-sm leading-relaxed">
        The page you're looking for doesn't exist, has been moved, or the link might be broken.
      </p>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary text-sm px-5"
        >
          ← Go Back
        </button>
        <Link to="/" className="btn-primary text-sm px-5">
          Go to Home
        </Link>
      </div>

      {/* Quick links */}
      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Popular Pages
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: '/items',       icon: '📋', label: 'Browse Items'   },
            { to: '/report/lost', icon: '🔍', label: 'Report Lost'    },
            { to: '/dashboard',   icon: '📊', label: 'Dashboard'      },
            { to: '/register',    icon: '👤', label: 'Create Account' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="card p-3 flex items-center gap-2.5 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotFound;
