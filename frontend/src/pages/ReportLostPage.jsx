import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ItemForm from '../components/ItemForm';
import Toast, { useToast } from '../components/Toast';
import { createItem } from '../api/items';

function ReportLostPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    try {
      await createItem(formData);
      showToast('Lost item reported successfully!', 'success');
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
        <h1 className="text-2xl font-bold text-gray-900">Report a Lost Item</h1>
        <p className="text-sm text-gray-400 mt-1">Provide as much detail as possible to help others identify it.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card-lg p-8">
            <ItemForm type="LOST" onSubmit={handleSubmit} isLoading={isLoading} error={error} />
          </div>
        </div>

        {/* Tips sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">💡 Tips for a good report</h3>
            <ul className="space-y-2.5">
              {[
                'Include brand, colour, and size.',
                'Mention any unique marks or damage.',
                'Be specific about the location.',
                'Upload a photo if you have one.',
                'Check your matches after posting.',
              ].map(t => (
                <li key={t} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5 bg-red-50 border-red-100">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="text-sm font-semibold text-red-700 mb-1">Lost something?</h3>
            <p className="text-xs text-red-400 leading-relaxed">
              After posting, browse the found items list — someone may have already found it!
            </p>
            <Link to="/items?type=FOUND" className="inline-block mt-3 text-xs font-semibold text-red-600 hover:text-red-800">
              Browse Found Items →
            </Link>
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}

export default ReportLostPage;
