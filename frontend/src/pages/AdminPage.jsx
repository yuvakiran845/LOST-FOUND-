import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast';
import {
  fetchAdminStats,
  fetchAdminItems,
  fetchAdminUsers,
  fetchAdminRequests,
  adminDeleteItem,
  adminUpdateItemStatus,
} from '../api/admin';

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ icon, value, label, color, bg, sub }) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
        {icon}
      </div>
      <div className={`text-3xl font-bold ${color} mb-0.5`}>{value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────────── */
function SectionHeader({ title, count, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {count !== undefined && (
          <p className="text-xs text-gray-400">{count} total</p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    LOST:     { cls: 'badge-lost',     label: 'Lost'     },
    FOUND:    { cls: 'badge-found',    label: 'Found'    },
    MATCHED:  { cls: 'badge-matched',  label: 'Matched'  },
    RETURNED: { cls: 'badge-returned', label: 'Returned' },
    PENDING:  { cls: 'bg-yellow-100 text-yellow-700 badge', label: 'Pending'  },
    ACCEPTED: { cls: 'bg-green-100 text-green-700 badge',   label: 'Accepted' },
    REJECTED: { cls: 'bg-red-100 text-red-700 badge',       label: 'Rejected' },
  }[status] || { cls: 'badge bg-gray-100 text-gray-600', label: status };

  return <span className={cfg.cls}>{cfg.label}</span>;
}

/* ─── Search Input ───────────────────────────────────────────────────────── */
function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 text-sm w-64"
      />
    </div>
  );
}

/* ─── Items Table ───────────────────────────────────────────────────────── */
function ItemsTable({ showToast }) {
  const [items,      setItems]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [deleting,   setDeleting]   = useState(null);
  const [confirm,    setConfirm]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchAdminItems({ page, limit: 15, search: search || undefined, type: typeFilter || undefined });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch { showToast('Failed to load items.', 'error'); }
    finally { setLoading(false); }
  }, [page, search, typeFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, typeFilter]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await adminDeleteItem(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setTotal((t) => t - 1);
      showToast('Item deleted.', 'success');
    } catch { showToast('Delete failed.', 'error'); }
    finally { setDeleting(null); setConfirm(null); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await adminUpdateItemStatus(id, status);
      setItems((prev) => prev.map((i) => i._id === id ? { ...i, status: data.item.status } : i));
      showToast('Status updated.', 'success');
    } catch { showToast('Update failed.', 'error'); }
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <SectionHeader title="All Items" count={total} />
        <div className="flex gap-2 items-center">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input text-sm w-32">
            <option value="">All Types</option>
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Search items…" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Reported By</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3,4,5].map((n) => (
                <tr key={n} className="animate-pulse">
                  {[1,2,3,4,5,6].map((m) => (
                    <td key={m} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">No items found</td></tr>
            ) : items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/items/${item._id}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 max-w-xs block">
                    {item.title}
                  </Link>
                  <p className="text-xs text-gray-400 truncate max-w-xs">{item.location}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.type} />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {['LOST','FOUND','MATCHED','RETURNED'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700 text-xs font-medium">{item.reportedBy?.name}</p>
                  <p className="text-gray-400 text-xs">{item.reportedBy?.email}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-right">
                  {confirm === item._id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleDelete(item._id)} disabled={deleting === item._id} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                        {deleting === item._id ? '…' : 'Confirm'}
                      </button>
                      <button onClick={() => setConfirm(null)} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirm(item._id)} className="text-xs px-3 py-1 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Users Table ───────────────────────────────────────────────────────── */
function UsersTable({ showToast }) {
  const [users,      setUsers]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchAdminUsers({ page, limit: 15, search: search || undefined });
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch { showToast('Failed to load users.', 'error'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <SectionHeader title="All Users" count={total} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Items</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3,4,5].map((n) => (
                <tr key={n} className="animate-pulse">
                  {[1,2,3,4].map((m) => (
                    <td key={m} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                    {user.itemCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Requests Table ────────────────────────────────────────────────────── */
function RequestsTable({ showToast }) {
  const [requests,   setRequests]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusF,    setStatusF]    = useState('');
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchAdminRequests({ page, limit: 15, status: statusF || undefined });
      setRequests(data.requests);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch { showToast('Failed to load requests.', 'error'); }
    finally { setLoading(false); }
  }, [page, statusF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusF]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <SectionHeader title="All Recovery Requests" count={total} />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="input text-sm w-36">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Requester</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1,2,3,4,5].map((n) => (
                <tr key={n} className="animate-pulse">
                  {[1,2,3,4,5].map((m) => (
                    <td key={m} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">No requests found</td></tr>
            ) : requests.map((req) => (
              <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/items/${req.item?._id}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600 text-xs">
                    {req.item?.title || 'Deleted item'}
                  </Link>
                  {req.item?.type && <span className={`ml-1.5 ${req.item.type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>{req.item.type}</span>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-700">{req.requester?.name}</p>
                  <p className="text-xs text-gray-400">{req.requester?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-700">{req.itemOwner?.name}</p>
                  <p className="text-xs text-gray-400">{req.itemOwner?.email}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Admin Page ───────────────────────────────────────────────────── */
function AdminPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { toast, showToast } = useToast();

  const [stats,      setStats]      = useState(null);
  const [statsLoad,  setStatsLoad]  = useState(true);
  const [activeTab,  setActiveTab]  = useState('items'); // 'items' | 'users' | 'requests'
  const [forbidden,  setForbidden]  = useState(false);

  useEffect(() => {
    fetchAdminStats()
      .then(({ data }) => setStats(data.stats))
      .catch((err) => {
        if (err.response?.status === 403) setForbidden(true);
      })
      .finally(() => setStatsLoad(false));
  }, []);

  if (forbidden) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your account ({user?.email}) is not listed as an admin.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary text-sm">Go Home</button>
      </div>
    );
  }

  const tabs = [
    { key: 'items',    label: 'Items',    icon: '📦' },
    { key: 'users',    label: 'Users',    icon: '👥' },
    { key: 'requests', label: 'Requests', icon: '📬' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-sm text-gray-500">Platform overview and moderation tools.</p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon="👥" value={statsLoad ? '—' : stats?.users.total}        label="Users"          color="text-gray-900"    bg="bg-gray-100" />
        <StatCard icon="📦" value={statsLoad ? '—' : stats?.items.total}        label="Total Items"    color="text-blue-600"    bg="bg-blue-50" />
        <StatCard icon="🔍" value={statsLoad ? '—' : stats?.items.lost}         label="Lost"           color="text-red-600"     bg="bg-red-50" />
        <StatCard icon="🤝" value={statsLoad ? '—' : stats?.items.found}        label="Found"          color="text-green-600"   bg="bg-green-50" />
        <StatCard icon="✅" value={statsLoad ? '—' : stats?.items.returned}     label="Returned"       color="text-blue-600"    bg="bg-blue-50"
                  sub={!statsLoad ? `${stats?.items.returnRate}% return rate` : undefined} />
        <StatCard icon="📬" value={statsLoad ? '—' : stats?.requests.pending}   label="Pending Claims" color="text-yellow-600"  bg="bg-yellow-50" />
      </div>

      {/* ── Category Breakdown ── */}
      {!statsLoad && stats?.categoryBreakdown?.length > 0 && (
        <div className="card p-5 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Items by Category</p>
          <div className="flex flex-wrap gap-2">
            {stats.categoryBreakdown.map(({ category, count }) => (
              <div key={category} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-sm font-semibold text-gray-800">{count}</span>
                <span className="text-xs text-gray-500">{category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'items'    && <ItemsTable    showToast={showToast} />}
      {activeTab === 'users'    && <UsersTable    showToast={showToast} />}
      {activeTab === 'requests' && <RequestsTable showToast={showToast} />}

      <Toast toast={toast} />
    </div>
  );
}

export default AdminPage;
