import { Link } from 'react-router-dom';
import { CATEGORY_ICONS } from '../constants/categories';

/**
 * MatchCard — displays a single potential match result.
 *
 * @param {Object} match  - { item, score, label, reasons }
 */
function MatchCard({ match }) {
  const { item, score, label, reasons } = match;
  const icon = CATEGORY_ICONS[item.category] || '📦';

  const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  // Color theme based on match strength
  const scoreTheme =
    score >= 80 ? { bar: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' } :
    score >= 60 ? { bar: 'bg-yellow-500', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' } :
                  { bar: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200' };

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Image */}
      <div className="w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
        {item.image?.url ? (
          <img src={item.image.url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-30">{icon}</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2">
          <span className={item.type === 'LOST' ? 'badge-lost' : 'badge-found'}>
            {item.type}
          </span>
          <span className="text-xs text-gray-400">{item.category}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
          {item.title}
        </h3>

        {/* Meta */}
        <div className="text-xs text-gray-400 space-y-0.5 mb-4">
          <div className="flex items-center gap-1">
            <span>📍</span>
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Match Score */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">Match Score</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreTheme.badge}`}>
              {label}
            </span>
          </div>
          {/* Score bar */}
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${scoreTheme.bar}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{score}%</p>
        </div>

        {/* Match Reasons */}
        <div className="space-y-1 mb-4">
          {reasons.map((reason) => (
            <div key={reason} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="text-green-500 font-bold">✓</span>
              {reason}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/items/${item._id}`}
            className="btn-secondary text-xs flex-1 text-center py-1.5"
          >
            View Item
          </Link>
          {/* Recovery request is Phase 6 */}
          <button
            disabled
            title="Coming in Phase 6"
            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-300 rounded-lg cursor-not-allowed"
          >
            Request Recovery
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchCard;
