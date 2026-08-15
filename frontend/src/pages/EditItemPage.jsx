import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchItemById, updateItem } from '../api/items';
import ItemForm from '../components/ItemForm';
import Toast, { useToast } from '../components/Toast';

function EditItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  const [item, setItem]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [error, setError]         = useState('');
  const [loadError, setLoadError] = useState('');

  // Load the item on mount
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchItemById(id);
        const fetchedItem = data.item;

        // Frontend ownership check — backend enforces this too
        if (fetchedItem.reportedBy?._id !== user?.id) {
          setLoadError('You are not authorized to edit this item.');
          return;
        }
        setItem(fetchedItem);
      } catch (err) {
        setLoadError(err.response?.status === 404
          ? 'Item not found.'
          : 'Failed to load item.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    setError('');
    try {
      await updateItem(id, formData);
      showToast('Item updated successfully!', 'success');
      setTimeout(() => navigate(`/items/${id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-8" />
        <div className="card p-6 space-y-4">
          {[1,2,3,4,5].map(n => (
            <div key={n} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 text-sm mb-4">{loadError}</p>
        <Link to="/my-items" className="btn-secondary text-sm">My Items</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link to={`/items/${id}`} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Back to Item
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Edit Item</h1>
        <p className="text-sm text-gray-500 mt-1">Update the details for your report.</p>
      </div>
      <div className="card p-6">
        <ItemForm
          type={item.type}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          error={error}
          initialData={item}
        />
      </div>
      <Toast toast={toast} />
    </div>
  );
}

export default EditItemPage;
