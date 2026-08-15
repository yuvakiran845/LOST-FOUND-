import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyItems } from '../api/items';
import { fetchSentRequests, fetchReceivedRequests } from '../api/requests';

/* ─── Stat Card ────────────────────────────────────────────────────────── */
function StatCard({ icon, value, label, color, bg, loading }) {
  return (
    <div className={`card p-5 ${loading ? 'animate-pulse' : ''}`}>
      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center text-lg mb-3`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold mb-0.5 ${color}`}>
        {loading ? <div className="h-6 w-10 bg-gray-100 rounded" /> : value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

/* ─── Quick Link ───────────────────────────────────────────────────────── */
function QuickLink({ to, icon, label, desc }) {
  return (
    <Link
      to={to}
      className="card p-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all group"
    >
      <div className="text-2xl w-10 text-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {label}
        </div>
        <div className="text-xs text-gray-400 truncate">{desc}</div>
      </div>
      <div className="text-gray-300 group-hover:text-blue-400 transition-colors">→</div>
    </Link>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
function ProfilePage() {
  const { user, logout } = useAuth();
  const [items,    setItems]    = useState([]);
  const [sent,     setSent]     = useState([]);
  const [received, setReceived] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMyItems(),
      fetchSentRequests(),
      fetchReceivedRequests(),
    ])
      .then(([itemsRes, sentRes, recvRes]) => {
        setItems(itemsRes.data.items || []);
        setSent(sentRes.data.requests || []);
        setReceived(recvRes.data.requests || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lostCount     = items.filter((i) => i.type === 'LOST').length;
  const foundCount    = items.filter((i) => i.type === 'FOUND').length;
  const returnedCount = items.filter((i) => i.status === 'RETURNED').length;
  const pendingRecv   = received.filter((r) => r.status === 'PENDING').length;

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Profile Header ── */}
      <div className="card p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">{user?.name}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {joinedDate && (
            <p className="text-xs text-gray-400 mt-1">Member since {joinedDate}</p>
          )}
        </div>

        {/* Log out */}
        <button
          onClick={logout}
          className="text-sm text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors whitespace-nowrap"
        >
          Sign Out
        </button>
      </div>

      {/* ── Stats ── */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Activity Overview
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="🔍" value={lostCount}
          label="Lost Reports" color="text-red-600" bg="bg-red-50" loading={loading}
        />
        <StatCard
          icon="🤝" value={foundCount}
          label="Found Reports" color="text-green-600" bg="bg-green-50" loading={loading}
        />
        <StatCard
          icon="✅" value={returnedCount}
          label="Items Returned" color="text-blue-600" bg="bg-blue-50" loading={loading}
        />
        <StatCard
          icon="📬" value={pendingRecv}
          label="Pending Claims" color="text-yellow-600" bg="bg-yellow-50" loading={loading}
        />
      </div>

      {/* ── Request Stats ── */}
      {!loading && (sent.length > 0 || received.length > 0) && (
        <div className="card p-5 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Recovery Requests
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{sent.length}</div>
              <div className="text-xs text-gray-500">Sent</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{received.length}</div>
              <div className="text-xs text-gray-500">Received</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {sent.filter((r) => r.status === 'ACCEPTED').length +
                  received.filter((r) => r.status === 'ACCEPTED').length}
              </div>
              <div className="text-xs text-gray-500">Resolved</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Links ── */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Quick Links
      </p>
      <div className="space-y-3">
        <QuickLink
          to="/my-items"  icon="📁"
          label="My Items"
          desc={loading ? 'Loading…' : `${items.length} total report${items.length !== 1 ? 's' : ''}`}
        />
        <QuickLink
          to="/requests"  icon="📬"
          label="Recovery Requests"
          desc={
            loading
              ? 'Loading…'
              : pendingRecv > 0
              ? `${pendingRecv} pending claim${pendingRecv !== 1 ? 's' : ''} need your attention`
              : 'View sent and received requests'
          }
        />
        <QuickLink
          to="/report/lost"  icon="🔍"
          label="Report a Lost Item"
          desc="Lost something? Post a report and get matched."
        />
        <QuickLink
          to="/report/found" icon="🤝"
          label="Report a Found Item"
          desc="Found something? Help reunite it with its owner."
        />
      </div>
    </div>
  );
}

export default ProfilePage;
