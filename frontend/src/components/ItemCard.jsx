import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_LABELS, CATEGORY_ICONS } from '../constants/categories';

/**
 * ItemCard — reusable card for displaying a lost/found item.
 * Used on: BrowseItemsPage, MyItemsPage
 */
function ItemCard({ item, showActions = false, onDelete, onMarkReturned }) {
  const [marking, setMarking] = useState(false);
  const icon = CATEGORY_ICONS[item.category] || '📦';
  const isReturned = item.status === 'RETURNED';
  const isMatched  = item.status === 'MATCHED';

  const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const handleMarkReturned = async () => {
    if (!onMarkReturned) return;
    setMarking(true);
    await onMarkReturned(item._id);
    setMarking(false);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md hover:border-gray-300 transition-all ${isReturned ? 'opacity-60' : ''}`}>

      {/* Image */}
      <div className="w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden relative">
        {item.image?.url ? (
          <img src={item.image.url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-20">{icon}</span>
        )}

        {/* Returned overlay */}
        {isReturned && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-3 py-1 rounded-full">
              ✓ Returned
            </span>
          </div>
        )}

        {/* Matched badge */}
        {isMatched && !isReturned && (
          <div className="absolute top-2 right-2">
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              Matched
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
            item.type === 'LOST' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
          }`}>
            {item.type}
          </span>
          <span className="ml-auto text-xs text-gray-400">{item.category}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{item.description}</p>

        {/* Meta */}
        <div className="text-xs text-gray-400 space-y-1 mb-4">
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📅</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex gap-2">
            <Link
              to={`/items/${item._id}`}
              className="flex-1 text-center text-xs font-medium py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              View Details
            </Link>
            {showActions && !isReturned && (
              <Link
                to={`/items/${item._id}/edit`}
                className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                Edit
              </Link>
            )}
            {showActions && (
              <button
                onClick={() => onDelete && onDelete(item._id)}
                className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {/* Mark as Returned */}
          {showActions && !isReturned && onMarkReturned && (
            <button
              onClick={handleMarkReturned}
              disabled={marking}
              className="w-full text-xs py-1.5 px-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors font-medium"
            >
              {marking ? 'Updating…' : '✓ Mark as Returned'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
