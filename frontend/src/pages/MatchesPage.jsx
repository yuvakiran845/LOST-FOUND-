import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import { fetchMatches } from '../api/matches';

/**
 * MatchesPage — /items/:id/matches
 *
 * Fetches and displays potential matches for a given item.
 * The scoring is done server-side by the matching service.
 */
function MatchesPage() {
  const { id } = useParams();

  const [data, setData]           = useState(null); // { referenceItem, matches }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const { data: res } = await fetchMatches(id);
        setData(res);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Item not found.'
            : 'Failed to load potential matches.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-1/4 mb-8 animate-pulse" />
        <p className="text-sm text-gray-400 mb-6 text-center">Finding potential matches...</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-full" />
                <div className="h-2 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-base font-semibold text-gray-700 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <Link to="/items" className="btn-primary text-sm">Browse All Items</Link>
      </div>
    );
  }

  const { referenceItem, matches } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-2">
        <Link
          to={`/items/${id}`}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Item
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Potential Matches</h1>
        <p className="text-sm text-gray-500 mt-1">
          Comparing{' '}
          <span className={referenceItem.type === 'LOST' ? 'badge-lost' : 'badge-found'}>
            {referenceItem.type}
          </span>{' '}
          <span className="font-medium text-gray-700">"{referenceItem.title}"</span>
          {' '}against all {referenceItem.type === 'LOST' ? 'found' : 'lost'} reports.
        </p>
      </div>

      {/* Score legend */}
      <div className="card p-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Match Score Legend
        </p>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">80–100% Strong Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-600">60–79% Good Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-gray-600">50–59% Possible Match</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ℹ️ Match Score is a <strong>heuristic estimate</strong> based on category, location, date, and keyword similarity — not a guarantee.
        </p>
      </div>

      {/* Result count */}
      {matches.length > 0 && (
        <p className="text-xs text-gray-400 mb-4">
          {matches.length} potential {matches.length === 1 ? 'match' : 'matches'} found
        </p>
      )}

      {/* No matches */}
      {matches.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">
            No potential matches found
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            We'll compare this report with future reports as new items are added.
          </p>
          <Link to="/items" className="btn-secondary text-sm">
            Browse All Items
          </Link>
        </div>
      )}

      {/* Match Grid */}
      {matches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {matches.map((match) => (
            <MatchCard key={match.item._id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MatchesPage;
