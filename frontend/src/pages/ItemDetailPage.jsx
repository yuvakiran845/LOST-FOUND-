import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchItemById, deleteItem } from '../api/items';
import { createRequest } from '../api/requests';
import Toast, { useToast } from '../components/Toast';
import { STATUS_LABELS, CATEGORY_ICONS } from '../constants/categories';

/* ─── Recovery Request Modal ───────────────────────────────────────────── */
function RecoveryModal({ item, onClose, onSuccess }) {
  const [message,    setMessage]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const MAX = 500;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please describe why this item is yours.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await createRequest({ itemId: item._id, message: message.trim() });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Request Recovery</h2>
        <p className="text-sm text-gray-500 mb-5">
          Describe why you believe <span className="font-medium text-gray-700">"{item.title}"</span> is yours.
          The reporter will review your claim.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="recovery-message">Your claim</label>
            <textarea
              id="recovery-message"
              rows={5}
              maxLength={MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. This is my blue wallet. It has my student ID inside and a small tear on the left corner. I lost it near the library on Monday."
              className="input resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {message.length}/{MAX}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary flex-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="btn-primary flex-1 text-sm"
            >
              {submitting ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  const [item,         setItem]         = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [requested,    setRequested]    = useState(false); // true after successful request

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchItemById(id);
        setItem(data.item);
      } catch (err) {
        setError(err.response?.status === 404
          ? 'This item does not exist or has been removed.'
          : 'Failed to load item details.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const isOwner = user && item && item.reportedBy?._id === user.id;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(id);
      showToast('Item deleted successfully.', 'success');
      setTimeout(() => navigate('/my-items'), 1200);
    } catch {
      showToast('Failed to delete item.', 'error');
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-72 bg-gray-100 rounded-xl" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-6 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Item Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <Link to="/items" className="btn-primary text-sm">Browse All Items</Link>
      </div>
    );
  }

  const statusConfig = STATUS_LABELS[item.status];
  const icon = CATEGORY_ICONS[item.category] || '📦';
  const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Show recovery button when: logged in, not the owner, item not returned
  const canRequest = user && !isOwner && item.status !== 'RETURNED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back link */}
      <Link to="/items" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        ← Back to Browse
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Image */}
        <div className="w-full h-72 md:h-96 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
          {item.image?.url ? (
            <img src={item.image.url} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-7xl opacity-30">{icon}</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className={item.type === 'LOST' ? 'badge-lost' : 'badge-found'}>
              {item.type}
            </span>
            <span className={statusConfig.className}>{statusConfig.label}</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h1>

          <p className="text-sm text-gray-500 leading-relaxed mb-6">{item.description}</p>

          {/* Meta grid */}
          <div className="space-y-3 mb-6">
            {[
              { icon: '🏷️', label: 'Category',    value: item.category },
              { icon: '📍', label: 'Location',     value: item.location },
              { icon: '📅', label: 'Date',         value: formattedDate },
              { icon: '👤', label: 'Reported by',  value: item.reportedBy?.name || 'Anonymous' },
            ].map(({ icon: i, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{i}</span>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm text-gray-800 font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Action Buttons ── */}
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">

            {/* View Matches — always visible when item is not RETURNED */}
            {item.status !== 'RETURNED' && (
              <Link
                to={`/items/${item._id}/matches`}
                className="btn-secondary w-full text-sm text-center"
              >
                🤖 View Potential Matches
              </Link>
            )}

            {/* Recovery Request — for non-owners */}
            {canRequest && !requested && (
              <button
                onClick={() => setShowRecovery(true)}
                className="btn-primary w-full text-sm"
              >
                📬 Request Recovery
              </button>
            )}

            {requested && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2.5">
                ✅ Recovery request sent! Check your requests for updates.
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex gap-3">
                <Link
                  to={`/items/${item._id}/edit`}
                  className="btn-secondary text-sm flex-1 text-center"
                >
                  ✏️ Edit Item
                </Link>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="text-sm px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  🗑 Delete
                </button>
              </div>
            )}

            {/* Prompt non-logged-in users */}
            {!user && item.status !== 'RETURNED' && (
              <p className="text-xs text-gray-400 text-center">
                <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
                {' '}to send a recovery request or view matches.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recovery Request Modal */}
      {showRecovery && (
        <RecoveryModal
          item={item}
          onClose={() => setShowRecovery(false)}
          onSuccess={() => {
            setShowRecovery(false);
            setRequested(true);
            showToast('Recovery request sent!', 'success');
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="card p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Delete this item?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. The item and its image will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1 text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-sm py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

export default ItemDetailPage;
