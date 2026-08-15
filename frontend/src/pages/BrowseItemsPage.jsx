import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import { fetchItems } from '../api/items';
import { CATEGORIES } from '../constants/categories';

// ─── Debounce Hook ────────────────────────────────────────────────────────
// Delays triggering API calls while the user is still typing.
// After the user stops typing for `delay` ms, the debounced value updates.
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // clear on each value change
  }, [value, delay]);
  return debounced;
}

// ─── Pagination Controls ─────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-secondary text-sm px-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>
      <span className="text-sm text-gray-500">
        Page <span className="font-semibold text-gray-800">{page}</span> of{' '}
        <span className="font-semibold text-gray-800">{totalPages}</span>
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary text-sm px-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className="rounded-2xl overflow-hidden border border-gray-200 bg-white animate-pulse">
          <div className="h-40 bg-gray-100" />
          <div className="p-4 space-y-2.5">
            <div className="h-3 w-16 bg-gray-100 rounded-md" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
            <div className="h-8 bg-gray-100 rounded-lg mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
function BrowseItemsPage() {
  // Keep filters synced with URL — enables refresh + shareable URLs
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Local filter state (controlled inputs) ──
  const [searchInput, setSearchInput] = useState(searchParams.get('search')    || '');
  const [type,        setType]        = useState(searchParams.get('type')      || '');
  const [category,    setCategory]    = useState(searchParams.get('category')  || '');
  const [location,    setLocation]    = useState(searchParams.get('location')  || '');
  const [fromDate,    setFromDate]    = useState(searchParams.get('fromDate')  || '');
  const [toDate,      setToDate]      = useState(searchParams.get('toDate')    || '');
  const [sort,        setSort]        = useState(searchParams.get('sort')      || 'newest');
  const [page,        setPage]        = useState(parseInt(searchParams.get('page')) || 1);

  // Debounced search — only triggers API call 400ms after user stops typing
  const debouncedSearch = useDebounce(searchInput, 400);

  // ── Results state ──
  const [items,      setItems]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState('');

  // ── Fetch items whenever any filter or page changes ──
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const filters = {
        search:   debouncedSearch || undefined,
        type:     type     || undefined,
        category: category || undefined,
        location: location || undefined,
        fromDate: fromDate || undefined,
        toDate:   toDate   || undefined,
        sort,
        page,
        limit: 12,
      };

      // Sync to URL (strip undefined values)
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && !(k === 'page' && v === 1) && !(k === 'sort' && v === 'newest')) {
          params[k] = String(v);
        }
      });
      setSearchParams(params, { replace: true });

      const { data } = await fetchItems(filters);
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('Unable to load items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, type, category, location, fromDate, toDate, sort, page]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // ── When search/filters change, reset to page 1 ──
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, type, category, location, fromDate, toDate, sort]);

  // ── Clear all filters ──
  const clearFilters = () => {
    setSearchInput('');
    setType('');
    setCategory('');
    setLocation('');
    setFromDate('');
    setToDate('');
    setSort('newest');
    setPage(1);
  };

  const hasActiveFilters = searchInput || type || category || location || fromDate || toDate || sort !== 'newest';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Lost &amp; Found Items</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Search and filter all reported items on campus.
        </p>
      </div>

      {/* ── Search + Filters Panel ── */}
      <div className="card-lg p-5 mb-6 space-y-4">

        {/* Search input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            id="browse-search"
            type="text"
            placeholder="Search by title, description, category, or location..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-9 text-sm"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

          {/* Type */}
          <select
            id="browse-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input text-sm"
          >
            <option value="">All Types</option>
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
          </select>

          {/* Category */}
          <select
            id="browse-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Location */}
          <input
            id="browse-location"
            type="text"
            placeholder="Location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input text-sm"
          />

          {/* From Date */}
          <input
            id="browse-fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input text-sm"
            title="From date"
          />

          {/* To Date */}
          <input
            id="browse-toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input text-sm"
            title="To date"
            min={fromDate || undefined}
          />

          {/* Sort */}
          <select
            id="browse-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-blue-600">
              Filters active
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-800 underline transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Result Count ── */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-gray-400">
            {total === 0
              ? 'No items found'
              : `${total} ${total === 1 ? 'item' : 'items'} found${hasActiveFilters ? ' (filtered)' : ''}`}
            {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && <SkeletonGrid />}

      {/* ── Error ── */}
      {!isLoading && error && (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">Unable to load items</h3>
          <p className="text-sm text-gray-400 mb-6">Please check your connection and try again.</p>
          <button onClick={loadItems} className="btn-primary text-sm">
            Retry
          </button>
        </div>
      )}

      {/* ── Empty — no items at all ── */}
      {!isLoading && !error && total === 0 && !hasActiveFilters && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">
            No items reported yet
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Be the first to report a lost or found item!
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/report/lost"  className="btn-secondary text-sm">Report Lost</Link>
            <Link to="/report/found" className="btn-primary text-sm">Report Found</Link>
          </div>
        </div>
      )}

      {/* ── Empty — search/filter returned nothing ── */}
      {!isLoading && !error && total === 0 && hasActiveFilters && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">
            No matching items found
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Try a different keyword, or clear your filters to see all items.
          </p>
          <button onClick={clearFilters} className="btn-secondary text-sm">
            Clear Filters
          </button>
        </div>
      )}

      {/* ── Items Grid ── */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>

          {/* ── Pagination ── */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}

export default BrowseItemsPage;
