import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchItems } from '../api/items';
import { CATEGORY_ICONS } from '../constants/categories';

/* ─── Item Preview Card ──────────────────────────────────────────── */
function PreviewCard({ item }) {
  const icon = CATEGORY_ICONS[item.category] || '📦';
  return (
    <Link to={`/items/${item._id}`} className="item-card group block">
      <div className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
        {item.image?.url
          ? <img src={item.image.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <span className="text-3xl opacity-20 group-hover:opacity-30 transition-opacity">{icon}</span>}
      </div>
      <div className="p-3.5">
        <span className={item.type === 'LOST' ? 'badge-lost' : 'badge-found'}>{item.type}</span>
        <p className="text-sm font-semibold text-gray-900 mt-2 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1 truncate"><span>📍</span>{item.location}</p>
      </div>
    </Link>
  );
}

/* ─── Landing Page ───────────────────────────────────────────────── */
function LandingPage() {
  const [recentItems,  setRecentItems]  = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    fetchItems({ limit: 6, sort: 'newest' })
      .then(({ data }) => setRecentItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">

        {/* Label pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          Campus Lost &amp; Found — SVCE
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
          Reuniting students<br />
          <span className="text-blue-600">with their belongings.</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          One platform to report, match, and recover lost items — without the WhatsApp chaos.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <Link to="/register" className="w-full sm:w-auto px-7 py-3 bg-gray-900 text-white font-semibold text-sm rounded-xl hover:bg-gray-700 transition-colors shadow-sm">
            Get Started — Free
          </Link>
          <Link to="/items" className="w-full sm:w-auto px-7 py-3 border border-gray-300 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors">
            Browse Items →
          </Link>
        </div>

        {/* Report cards */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/report/lost"
            className="w-full sm:w-auto flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200 transition-all group"
          >
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg flex-shrink-0 group-hover:shadow transition-shadow">🔍</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-red-700">Report Lost Item</div>
              <div className="text-xs text-red-400 mt-0.5">Lost something? Post it here</div>
            </div>
            <span className="ml-auto text-red-300 text-sm group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>

          <Link to="/report/found"
            className="w-full sm:w-auto flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-green-100 bg-green-50 hover:bg-green-100 hover:border-green-200 transition-all group"
          >
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg flex-shrink-0 group-hover:shadow transition-shadow">🤝</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-green-700">Report Found Item</div>
              <div className="text-xs text-green-500 mt-0.5">Found something? Help reunite it</div>
            </div>
            <span className="ml-auto text-green-300 text-sm group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-6 text-center">
          {[
            { value: '500+',  label: 'Items Reported'  },
            { value: '350+',  label: 'Items Returned'  },
            { value: '1,200+', label: 'Students Helped' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="section-label">Process</p>
          <h2 className="section-title">How it works</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">Three steps from lost to recovered.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              n: '01', icon: '📝', title: 'Report',
              desc: 'Post a lost or found item with description, category, location, and optional photo.',
              accent: 'bg-blue-50 border-blue-100',
              iconBg: 'bg-blue-100',
            },
            {
              n: '02', icon: '🔗', title: 'Match',
              desc: 'The system automatically pairs lost and found reports by category, location, and date.',
              accent: 'bg-violet-50 border-violet-100',
              iconBg: 'bg-violet-100',
            },
            {
              n: '03', icon: '✅', title: 'Recover',
              desc: 'Send a recovery request, verify ownership, and arrange a campus handover.',
              accent: 'bg-green-50 border-green-100',
              iconBg: 'bg-green-100',
            },
          ].map(s => (
            <div key={s.n} className={`rounded-2xl border-2 ${s.accent} p-7 hover:shadow-md transition-shadow`}>
              <div className={`w-12 h-12 ${s.iconBg} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-sm`}>
                {s.icon}
              </div>
              <div className="text-xs font-bold text-gray-300 tracking-widest mb-1">STEP {s.n}</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          RECENT ITEMS
      ════════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="section-label">Live Feed</p>
              <h2 className="text-xl font-bold text-gray-900">Recently Reported</h2>
              <p className="text-sm text-gray-400 mt-0.5">Latest items from campus</p>
            </div>
            <Link to="/items" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">View all →</Link>
          </div>

          {loadingItems ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                  <div className="h-36 skeleton" />
                  <div className="p-3.5 space-y-2">
                    <div className="skeleton h-3 w-1/3 rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-400 text-sm mb-5">No items yet. Be the first to report one!</p>
              <div className="flex gap-3 justify-center">
                <Link to="/report/lost"  className="btn-secondary text-sm">Report Lost</Link>
                <Link to="/report/found" className="btn-primary  text-sm">Report Found</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentItems.map(item => <PreviewCard key={item._id} item={item} />)}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="section-label">Features</p>
          <h2 className="section-title">Everything you need</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: '🔍', title: 'Smart Search',       desc: 'Filter by keyword, category, location, and date range instantly.' },
            { icon: '🔗', title: 'Auto Matching',      desc: 'Automatically pairs lost and found items by category & location.' },
            { icon: '📸', title: 'Photo Evidence',     desc: 'Attach photos to your report to help with faster identification.' },
            { icon: '📬', title: 'Recovery Requests',  desc: 'Claim items with a message. Owners accept or reject.' },
            { icon: '🔒', title: 'Secure Auth',        desc: 'JWT-protected routes. Only owners can edit or delete their posts.' },
            { icon: '📊', title: 'Dashboard',          desc: 'All your reports, requests, and matches in one clean view.' },
          ].map(f => (
            <div key={f.title} className="card p-6 hover:shadow-md hover:border-gray-300 transition-all">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl mb-4">{f.icon}</div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative bg-gray-900 rounded-3xl px-8 py-16 text-center overflow-hidden">
          {/* subtle texture */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Ready to find your lost item?
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
              Join students at SVCE already using CampusConnect.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="px-7 py-3 bg-white text-gray-900 font-semibold text-sm rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                Create Free Account
              </Link>
              <Link to="/items" className="px-7 py-3 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors">
                Browse Items →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-gray-500 text-sm font-medium">CampusConnect</span>
          </div>
          <p className="text-gray-300 text-xs">© {new Date().getFullYear()} CampusConnect · SVCE Final Year Project</p>
          <div className="flex items-center gap-5">
            <Link to="/items"    className="text-gray-400 hover:text-gray-700 text-xs transition-colors">Browse</Link>
            <Link to="/register" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">Sign Up</Link>
            <Link to="/login"    className="text-gray-400 hover:text-gray-700 text-xs transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
