import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ItemForm from '../components/ItemForm';
import Toast, { useToast } from '../components/Toast';
import { createItem } from '../api/items';

function ReportFoundPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    try {
      await createItem(formData);
      showToast('Found item reported successfully!', 'success');
      setTimeout(() => navigate('/my-items'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Report a Found Item</h1>
        <p className="text-sm text-gray-400 mt-1">Help reunite this item with its owner.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card-lg p-8">
            <ItemForm type="FOUND" onSubmit={handleSubmit} isLoading={isLoading} error={error} />
          </div>
        </div>

        {/* Tips sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">💡 Tips for a good report</h3>
            <ul className="space-y-2.5">
              {[
                'Describe exactly where you found it.',
                'Note colour, brand, and condition.',
                'Upload a photo to help identification.',
                'Check matches — owner may have posted.',
                'Be ready to verify ownership claims.',
              ].map(t => (
                <li key={t} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5 bg-green-50 border-green-100">
            <div className="text-2xl mb-2">🤝</div>
            <h3 className="text-sm font-semibold text-green-700 mb-1">Good Samaritan!</h3>
            <p className="text-xs text-green-500 leading-relaxed">
              Thank you for taking the time to report a found item. Your post helps reunite it with its owner.
            </p>
            <Link to="/items?type=LOST" className="inline-block mt-3 text-xs font-semibold text-green-700 hover:text-green-900">
              Browse Lost Items →
            </Link>
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}

export default ReportFoundPage;
