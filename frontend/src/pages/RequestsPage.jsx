import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchSentRequests, fetchReceivedRequests, respondToRequest } from '../api/requests';
import Toast, { useToast } from '../components/Toast';

/* ─── Status Badge ─────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    PENDING:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700' },
    ACCEPTED: { label: 'Accepted', cls: 'bg-green-100  text-green-700'  },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100    text-red-700'    },
  }[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

/* ─── Sent Request Card ────────────────────────────────────────────────── */
function SentCard({ request }) {
  const { item, itemOwner, message, status, createdAt } = request;
  const date = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${item?.type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
              {item?.type}
            </span>
            <StatusBadge status={status} />
          </div>
          <Link
            to={`/items/${item?._id}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
          >
            {item?.title || 'Unknown Item'}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">
            Reported by <span className="font-medium text-gray-600">{itemOwner?.name || 'Unknown'}</span>
            {' · '}
            <span>{item?.location}</span>
          </p>
        </div>
        <p className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{date}</p>
      </div>

      <div className="bg-gray-50 rounded-lg px-4 py-3">
        <p className="text-xs font-medium text-gray-400 mb-1">Your claim</p>
        <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
      </div>

      {status === 'ACCEPTED' && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <span>✅</span>
          <span>Your request was accepted! Coordinate with the reporter to collect your item.</span>
        </div>
      )}
      {status === 'REJECTED' && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
          <span>❌</span>
          <span>Your request was rejected. The reporter determined this item isn't yours.</span>
        </div>
      )}
    </div>
  );
}

/* ─── Received Request Card ────────────────────────────────────────────── */
function ReceivedCard({ request, onRespond }) {
  const { item, requester, message, status, createdAt } = request;
  const [acting, setActing] = useState(false);
  const date = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const handleAction = async (action) => {
    setActing(true);
    await onRespond(request._id, action);
    setActing(false);
  };

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${item?.type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
              {item?.type}
            </span>
            <StatusBadge status={status} />
          </div>
          <Link
            to={`/items/${item?._id}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
          >
            {item?.title || 'Unknown Item'}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">
            Claim from <span className="font-medium text-gray-600">{requester?.name || 'Unknown'}</span>
            {' · '}{requester?.email}
            {' · '}{date}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-4 py-3">
        <p className="text-xs font-medium text-gray-400 mb-1">Their message</p>
        <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
      </div>

      {status === 'PENDING' && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => handleAction('accept')}
            disabled={acting}
            className="flex-1 text-sm py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {acting ? 'Processing…' : '✅ Accept'}
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={acting}
            className="flex-1 text-sm py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors font-medium"
          >
            {acting ? 'Processing…' : '✗ Reject'}
          </button>
        </div>
      )}

      {status === 'ACCEPTED' && (
        <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
          ✅ You accepted this request. The item has been marked as returned.
        </p>
      )}
      {status === 'REJECTED' && (
        <p className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
          ✗ You rejected this request.
        </p>
      )}
    </div>
  );
}

/* ─── Empty State ──────────────────────────────────────────────────────── */
function EmptyState({ tab }) {
  const isSent = tab === 'sent';
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">{isSent ? '📬' : '📥'}</div>
      <h3 className="text-base font-semibold text-gray-700 mb-2">
        {isSent ? 'No requests sent yet' : 'No requests received yet'}
      </h3>
      <p className="text-sm text-gray-400 mb-6">
        {isSent
          ? 'Browse items and click "Request Recovery" on any item you recognise as yours.'
          : "When someone claims one of your reported items, it will appear here."}
      </p>
      {isSent && (
        <Link to="/items" className="btn-primary text-sm">
          Browse Items
        </Link>
      )}
    </div>
  );
}

/* ─── Loading Skeleton ─────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="card p-5 animate-pulse space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-14 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-16 bg-gray-50 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
function RequestsPage() {
  const [activeTab,  setActiveTab]  = useState('received'); // 'sent' | 'received'
  const [sent,       setSent]       = useState([]);
  const [received,   setReceived]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const { toast, showToast }        = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sentRes, recvRes] = await Promise.all([
        fetchSentRequests(),
        fetchReceivedRequests(),
      ]);
      setSent(sentRes.data.requests);
      setReceived(recvRes.data.requests);
    } catch {
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async (requestId, action) => {
    try {
      const { data } = await respondToRequest(requestId, action);
      // Update local state so the card reflects the new status immediately
      setReceived((prev) =>
        prev.map((r) => (r._id === requestId ? data.request : r))
      );
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed. Please try again.', 'error');
    }
  };

  const tabs = [
    { key: 'received', label: 'Received', count: received.length },
    { key: 'sent',     label: 'Sent',     count: sent.length },
  ];

  const list = activeTab === 'sent' ? sent : received;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Recovery Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage claims on items you reported, or check the status of your own requests.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {!loading && tab.count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <Skeleton />}

      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={load} className="btn-primary text-sm">Retry</button>
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <EmptyState tab={activeTab} />
      )}

      {!loading && !error && list.length > 0 && (
        <div className="space-y-4">
          {activeTab === 'sent'
            ? list.map((r) => <SentCard key={r._id} request={r} />)
            : list.map((r) => (
                <ReceivedCard key={r._id} request={r} onRespond={handleRespond} />
              ))}
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

export default RequestsPage;
