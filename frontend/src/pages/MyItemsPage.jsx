import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import Toast, { useToast } from '../components/Toast';
import { fetchMyItems, deleteItem, updateItem } from '../api/items';

function MyItemsPage() {
  const { toast, showToast } = useToast();

  const [items,         setItems]         = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState('');
  const [activeTab,     setActiveTab]     = useState('ALL');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const loadMyItems = async () => {
    setIsLoading(true); setError('');
    try {
      const { data } = await fetchMyItems();
      setItems(data.items);
    } catch {
      setError('Failed to load your items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadMyItems(); }, []);

  const filtered   = items.filter(i => activeTab === 'ALL' ? true : i.type === activeTab);
  const lostCount  = items.filter(i => i.type === 'LOST').length;
  const foundCount = items.filter(i => i.type === 'FOUND').length;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteItem(confirmDelete);
      setItems(prev => prev.filter(i => i._id !== confirmDelete));
      showToast('Item deleted.', 'success');
    } catch {
      showToast('Failed to delete item.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleMarkReturned = async (itemId) => {
    try {
      await updateItem(itemId, { status: 'RETURNED' });
      setItems(prev => prev.map(i => i._id === itemId ? { ...i, status: 'RETURNED' } : i));
      showToast('Item marked as returned ✅', 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const tabs = [
    { key: 'ALL',   label: 'All',   count: items.length  },
    { key: 'LOST',  label: 'Lost',  count: lostCount     },
    { key: 'FOUND', label: 'Found', count: foundCount    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Items</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your lost and found reports.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link to="/report/lost"  className="btn-secondary text-sm">+ Report Lost</Link>
          <Link to="/report/found" className="btn-primary  text-sm">+ Report Found</Link>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total',    value: items.length,                              dot: 'bg-gray-400'  },
            { label: 'Lost',     value: lostCount,                                 dot: 'bg-red-400'   },
            { label: 'Found',    value: foundCount,                                dot: 'bg-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-0.5 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs font-semibold ${activeTab === tab.key ? 'text-gray-500' : 'text-gray-300'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(n => (
            <div key={n} className="rounded-2xl overflow-hidden border border-gray-200 animate-pulse bg-white">
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-2.5">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-8 bg-gray-100 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {!isLoading && error && (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button onClick={loadMyItems} className="btn-primary text-sm">Retry</button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
          <div className="text-5xl mb-4">{activeTab === 'FOUND' ? '🤝' : '🔍'}</div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">
            No {activeTab === 'ALL' ? '' : activeTab.toLowerCase() + ' '}items yet
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {activeTab === 'FOUND' ? 'Found something? Let others know!' : 'Lost something? Report it now.'}
          </p>
          <Link
            to={activeTab === 'FOUND' ? '/report/found' : '/report/lost'}
            className="btn-primary text-sm"
          >
            {activeTab === 'FOUND' ? 'Report Found Item' : 'Report Lost Item'}
          </Link>
        </div>
      )}

      {/* ── Items Grid ── */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(item => (
            <ItemCard
              key={item._id}
              item={item}
              showActions
              onDelete={id => setConfirmDelete(id)}
              onMarkReturned={handleMarkReturned}
            />
          ))}
        </div>
      )}

      {/* ── Delete Dialog ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card-lg p-6 w-full max-w-sm">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl mb-4">🗑️</div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Delete this item?</h2>
            <p className="text-sm text-gray-400 mb-6">
              This action cannot be undone. The item and its image will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1 text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex-1 text-sm"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

export default MyItemsPage;
