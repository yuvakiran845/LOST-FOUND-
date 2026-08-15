import { useState } from 'react';
import { CATEGORIES } from '../constants/categories';

/**
 * ItemForm — reusable form for reporting and editing items.
 *
 * Props:
 *   type        "LOST" | "FOUND"
 *   onSubmit    called with { ...fields, type, image }
 *   isLoading   show spinner on submit
 *   error       server-side error string
 *   initialData pre-fill for edit mode
 */
function ItemForm({ type, onSubmit, isLoading, error, initialData = null }) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    title:       initialData?.title       || '',
    description: initialData?.description || '',
    category:    initialData?.category    || '',
    location:    initialData?.location    || '',
    date:        initialData?.date
                   ? new Date(initialData.date).toISOString().split('T')[0]
                   : '',
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image?.url || null);
  const [formError,    setFormError]    = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setFormError('Please select an image file (jpg, png, webp).'); return; }
    if (file.size > 5 * 1024 * 1024)   { setFormError('Image must be smaller than 5 MB.'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setFormError('');
  };

  const validate = () => {
    if (!form.title.trim())       return 'Title is required.';
    if (!form.category)           return 'Please select a category.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.location.trim())    return 'Location is required.';
    if (!form.date)               return 'Date is required.';
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    onSubmit({ ...form, type, image: imageFile });
  };

  const displayError = formError || error;
  const isLost = type === 'LOST';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* Error */}
      {displayError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span className="mt-0.5 flex-shrink-0">⚠️</span>
          <span>{displayError}</span>
        </div>
      )}

      {/* Type indicator */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${
        isLost ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
      }`}>
        <span className="text-lg">{isLost ? '🔍' : '🤝'}</span>
        <div>
          <span className="text-xs text-gray-400 font-medium">Reporting as</span>
          <div className={`text-sm font-bold ${isLost ? 'text-red-700' : 'text-green-700'}`}>
            {isLost ? 'Lost Item' : 'Found Item'}
          </div>
        </div>
        <span className={`ml-auto ${isLost ? 'badge-lost' : 'badge-found'}`}>{type}</span>
      </div>

      {/* ── Two-column layout for Title + Category ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="item-title" className="label">Item Title *</label>
          <input
            id="item-title" name="title" type="text"
            placeholder='e.g. "Blue JioFi WiFi Dongle"'
            value={form.title} onChange={handleChange}
            className="input" disabled={isLoading} maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="item-category" className="label">Category *</label>
          <select
            id="item-category" name="category"
            value={form.category} onChange={handleChange}
            className="input" disabled={isLoading}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="item-desc" className="label">Description *</label>
        <textarea
          id="item-desc" name="description" rows={4}
          placeholder="Describe the item — colour, brand, size, distinguishing features..."
          value={form.description} onChange={handleChange}
          className="input resize-none" disabled={isLoading} maxLength={1000}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">Be as specific as possible to help with matching.</span>
          <span className="text-xs text-gray-300">{form.description.length}/1000</span>
        </div>
      </div>

      {/* ── Two-column: Location + Date ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="item-location" className="label">Location *</label>
          <input
            id="item-location" name="location" type="text"
            placeholder='e.g. "Library 2nd Floor"'
            value={form.location} onChange={handleChange}
            className="input" disabled={isLoading} maxLength={200}
          />
        </div>
        <div>
          <label htmlFor="item-date" className="label">
            Date {isLost ? 'Lost' : 'Found'} *
          </label>
          <input
            id="item-date" name="date" type="date"
            value={form.date} onChange={handleChange}
            className="input" disabled={isLoading}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Photo upload */}
      <div>
        <label className="label">Photo <span className="text-gray-300 font-normal">(optional)</span></label>

        {imagePreview && (
          <div className="mb-3 relative w-full h-52 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white text-gray-700 rounded-full text-xs flex items-center justify-center shadow-sm border border-gray-200 transition-colors"
            >
              ✕
            </button>
            <span className="absolute bottom-2 left-3 text-white text-xs font-medium">Preview</span>
          </div>
        )}

        <label
          htmlFor="item-image"
          className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            imagePreview
              ? 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/40'
          }`}
        >
          <span className="text-2xl mb-1">📷</span>
          <span className="text-sm font-medium text-gray-500">
            {imagePreview ? 'Change photo' : 'Click to upload a photo'}
          </span>
          <span className="text-xs text-gray-300 mt-0.5">JPG, PNG, WebP — max 5 MB</span>
          <input
            id="item-image" type="file" accept="image/*"
            onChange={handleImageChange} className="hidden" disabled={isLoading}
          />
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn-primary w-full py-3 text-sm"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isEdit ? 'Saving changes…' : 'Submitting report…'}
          </span>
        ) : (
          isEdit ? 'Save Changes' : `Submit ${isLost ? 'Lost' : 'Found'} Item Report`
        )}
      </button>
    </form>
  );
}

export default ItemForm;
