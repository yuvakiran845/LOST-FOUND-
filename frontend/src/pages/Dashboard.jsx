import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyItems } from '../api/items';
import { fetchReceivedRequests } from '../api/requests';

function Dashboard() {
  const { user } = useAuth();
  const [myItems,     setMyItems]     = useState([]);
  const [pendingReqs, setPendingReqs] = useState(0);
  const [isLoading,   setIsLoading]   = useState(true);

  useEffect(() => {
    Promise.all([fetchMyItems(), fetchReceivedRequests()])
      .then(([itemsRes, reqsRes]) => {
        setMyItems(itemsRes.data.items || []);
        const p = (reqsRes.data.requests || []).filter(r => r.status === 'PENDING').length;
        setPendingReqs(p);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const lostItems    = myItems.filter(i => i.type === 'LOST');
  const foundItems   = myItems.filter(i => i.type === 'FOUND');
  const matchedItems = myItems.filter(i => i.status === 'MATCHED');
  const returned     = myItems.filter(i => i.status === 'RETURNED');

  const stats = [
    { label: 'Lost Reports',  value: lostItems.length,    color: 'text-red-600',   dot: 'bg-red-400'   },
    { label: 'Found Reports', value: foundItems.length,   color: 'text-green-600', dot: 'bg-green-400' },
    { label: 'Matched',       value: matchedItems.length, color: 'text-amber-600', dot: 'bg-amber-400' },
    { label: 'Returned',      value: returned.length,     color: 'text-blue-600',  dot: 'bg-blue-400'  },
  ];

  const actions = [
    { to: '/report/lost',  icon: '🔍', label: 'Report Lost',        desc: 'Post a lost item on campus.'    },
    { to: '/report/found', icon: '🤝', label: 'Report Found',       desc: 'Post something you found.'      },
    { to: '/items',        icon: '📋', label: 'Browse Items',       desc: 'Search all reports.'             },
    { to: '/my-items',     icon: '📁', label: 'My Items',           desc: 'View and manage your reports.'  },
    { to: '/requests',     icon: '📬', label: 'Requests',
      desc: pendingReqs > 0 ? `${pendingReqs} pending claim${pendingReqs !== 1 ? 's' : ''}` : 'Manage recovery claims.' },
    { to: '/profile',      icon: '👤', label: 'Profile',            desc: 'Your account and stats.'        },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
        </div>
        <Link
          to="/report/lost"
          className="hidden sm:block px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Report Item
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color} mb-1`}>
              {isLoading ? '—' : s.value}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {actions.map(a => (
          <Link
            key={a.to + a.label}
            to={a.to}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 hover:shadow-sm transition-all group"
          >
            <div className="text-xl mb-3">{a.icon}</div>
            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-0.5">
              {a.label}
            </div>
            <div className="text-xs text-gray-400 leading-snug">{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* ── Recent Items ── */}
      {!isLoading && myItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent Reports</p>
            <Link to="/my-items" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {myItems.slice(0, 5).map(item => (
              <Link
                key={item._id}
                to={`/items/${item._id}`}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  item.type === 'LOST' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                }`}>
                  {item.type}
                </span>
                <span className="text-sm font-medium text-gray-800 flex-1 truncate">{item.title}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-gray-300 text-xs">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && myItems.length === 0 && (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-2xl bg-white">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 text-sm mb-5">You haven't reported any items yet.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/report/lost"  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Report Lost</Link>
            <Link to="/report/found" className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700">Report Found</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
