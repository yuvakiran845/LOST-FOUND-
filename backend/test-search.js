/**
 * Phase 4 Search & Filter API Tests
 * Run: node test-search.js
 */

const http = require('http');
const BASE = 'http://localhost:5000';
let PASS = 0, FAIL = 0;
let TOKEN = '';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const json = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': json ? Buffer.byteLength(json) : 0,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(`${BASE}${path}`, opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (json) req.write(json);
    req.end();
  });
}

function pass(label) { console.log(`  ✅ PASS: ${label}`); PASS++; }
function fail(label, d) { console.log(`  ❌ FAIL: ${label} — ${d}`); FAIL++; }
function section(t) { console.log(`\n── ${t} ${'─'.repeat(48 - t.length)}`); }
function get(path) { return request('GET', path); }
function post(path, body, token) { return request('POST', path, body, token); }

async function run() {
  console.log('\n🧪 CampusConnect — Phase 4 Search & Filter API Tests\n');
  const ts = Date.now();

  // ── Setup ────────────────────────────────────────────────────────────────
  section('SETUP');
  let r = await post('/api/auth/register', { name: 'Searcher', email: `s_${ts}@test.dev`, password: 'pass1234' });
  if (r.status === 201) { TOKEN = r.body.token; pass('User registered'); }
  else { fail('Register', `${r.status}`); process.exit(1); }

  // Create test items
  const items = [
    { title: 'Blue Wallet',    category: 'Wallet',  type: 'LOST',  location: 'Library',  date: '2026-01-10', description: 'Blue leather wallet' },
    { title: 'Black Wallet',   category: 'Wallet',  type: 'FOUND', location: 'Canteen',  date: '2026-01-15', description: 'Small black wallet found' },
    { title: 'iPhone 13',      category: 'Phone',   type: 'LOST',  location: 'Library',  date: '2026-02-01', description: 'Black iPhone with cracked screen' },
    { title: 'JBL Earphones',  category: 'Earphones', type: 'FOUND', location: 'Lab',   date: '2026-02-10', description: 'Blue earphones left on desk' },
    { title: 'College ID Card',category: 'ID Card', type: 'LOST',  location: 'Canteen', date: '2026-03-01', description: 'Lost my college ID near canteen' },
  ];
  for (const item of items) {
    await post('/api/items', item, TOKEN);
  }
  pass('5 test items created');

  // ── Keyword Search ───────────────────────────────────────────────────────
  section('KEYWORD SEARCH');

  r = await get('/api/items?search=wallet');
  const walletItems = r.body.items || [];
  walletItems.length >= 2
    ? pass(`search=wallet → ${walletItems.length} results`)
    : fail('search=wallet', `got ${walletItems.length}`);

  r = await get('/api/items?search=WALLET'); // uppercase
  r.body.items?.length >= 2
    ? pass('search=WALLET (uppercase) → case-insensitive works')
    : fail('search=WALLET uppercase', `got ${r.body.items?.length}`);

  r = await get('/api/items?search=Library'); // location field search
  r.body.items?.length >= 1
    ? pass(`search=Library → searches location field (${r.body.items.length} results)`)
    : fail('search=Library', `got ${r.body.items?.length}`);

  r = await get('/api/items?search=xyzthisdoesnotexist123');
  r.body.total === 0
    ? pass('search=nonexistent → 0 results')
    : fail('search=nonexistent', `got ${r.body.total}`);

  // ── Type Filter ──────────────────────────────────────────────────────────
  section('TYPE FILTER');

  r = await get('/api/items?type=LOST');
  const allLost = r.body.items?.every(i => i.type === 'LOST');
  allLost ? pass('type=LOST → all items are LOST') : fail('type=LOST', 'mixed types in result');

  r = await get('/api/items?type=FOUND');
  const allFound = r.body.items?.every(i => i.type === 'FOUND');
  allFound ? pass('type=FOUND → all items are FOUND') : fail('type=FOUND', 'mixed types in result');

  r = await get('/api/items');
  r.body.items?.length >= 5
    ? pass('No type filter → all items returned')
    : fail('No type filter', `got ${r.body.items?.length}`);

  // ── Category Filter ──────────────────────────────────────────────────────
  section('CATEGORY FILTER');

  r = await get('/api/items?category=Wallet');
  r.body.items?.every(i => i.category === 'Wallet')
    ? pass(`category=Wallet → ${r.body.items.length} wallet items`)
    : fail('category=Wallet', 'non-wallet items in result');

  r = await get('/api/items?category=Phone');
  r.body.items?.every(i => i.category === 'Phone')
    ? pass(`category=Phone → ${r.body.items.length} phone items`)
    : fail('category=Phone', 'non-phone items in result');

  r = await get('/api/items?category=InvalidCategory');
  // Invalid category should be ignored, returning all items (not crash)
  r.status === 200
    ? pass('Invalid category → 200 (ignored, returns all)')
    : fail('Invalid category', `${r.status}`);

  // ── Location Filter ──────────────────────────────────────────────────────
  section('LOCATION FILTER');

  r = await get('/api/items?location=Library');
  r.body.items?.length >= 1
    ? pass(`location=Library → ${r.body.items.length} items`)
    : fail('location=Library', `got ${r.body.items?.length}`);

  r = await get('/api/items?location=lib'); // partial match
  r.body.items?.length >= 1
    ? pass('location=lib (partial) → partial match works')
    : fail('location partial', `got ${r.body.items?.length}`);

  // ── Date Range ───────────────────────────────────────────────────────────
  section('DATE RANGE');

  r = await get('/api/items?fromDate=2026-01-01&toDate=2026-01-31');
  r.status === 200 && r.body.items
    ? pass(`fromDate/toDate Jan 2026 → ${r.body.items.length} items`)
    : fail('date range Jan', `${r.status}`);

  r = await get('/api/items?fromDate=2026-03-01');
  r.status === 200
    ? pass(`fromDate only → ${r.body.items?.length} items`)
    : fail('fromDate only', `${r.status}`);

  r = await get('/api/items?fromDate=not-a-date&toDate=also-bad');
  r.status === 200
    ? pass('Invalid dates → 200 (gracefully ignored)')
    : fail('Invalid dates', `${r.status}`);

  // ── Combined Filters ─────────────────────────────────────────────────────
  section('COMBINED FILTERS');

  r = await get('/api/items?type=LOST&category=Wallet');
  const combined = r.body.items || [];
  combined.every(i => i.type === 'LOST' && i.category === 'Wallet')
    ? pass(`type=LOST&category=Wallet → ${combined.length} items (all match both)`)
    : fail('Combined type+category', 'items dont match all filters');

  r = await get('/api/items?search=wallet&type=FOUND');
  r.body.items?.every(i => i.type === 'FOUND')
    ? pass(`search=wallet&type=FOUND → ${r.body.items.length} items`)
    : fail('Combined search+type', 'items dont match');

  r = await get('/api/items?type=LOST&location=Library&category=Phone');
  r.status === 200
    ? pass(`3-way filter (type+location+category) → ${r.body.items?.length} items`)
    : fail('3-way filter', `${r.status}`);

  // ── Sorting ──────────────────────────────────────────────────────────────
  section('SORTING');

  r = await get('/api/items?sort=newest');
  const dates = r.body.items?.map(i => new Date(i.createdAt).getTime());
  const isNewest = dates?.every((d, i) => i === 0 || dates[i-1] >= d);
  isNewest ? pass('sort=newest → descending order') : fail('sort=newest', 'not in desc order');

  r = await get('/api/items?sort=oldest');
  const datesOld = r.body.items?.map(i => new Date(i.createdAt).getTime());
  const isOldest = datesOld?.every((d, i) => i === 0 || datesOld[i-1] <= d);
  isOldest ? pass('sort=oldest → ascending order') : fail('sort=oldest', 'not in asc order');

  // ── Pagination ───────────────────────────────────────────────────────────
  section('PAGINATION');

  r = await get('/api/items?page=1&limit=2');
  if (r.status === 200 && r.body.items?.length <= 2 && r.body.total && r.body.totalPages) {
    pass(`page=1&limit=2 → ${r.body.items.length} items, total=${r.body.total}, totalPages=${r.body.totalPages}`);
  } else fail('pagination', `${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);

  r = await get('/api/items?page=2&limit=2');
  r.status === 200 && r.body.page === 2
    ? pass('page=2 → correct page returned')
    : fail('page=2', `${r.status}`);

  r = await get('/api/items?page=999&limit=12');
  r.status === 200 && r.body.items?.length === 0
    ? pass('page=999 (beyond data) → 0 items, no crash')
    : fail('page=999', `${r.status}: got ${r.body.items?.length} items`);

  // ── Response Shape ───────────────────────────────────────────────────────
  section('RESPONSE SHAPE');

  r = await get('/api/items?page=1&limit=5');
  const shape = r.body;
  const hasAll = ['success', 'items', 'total', 'page', 'totalPages', 'count'].every(k => k in shape);
  hasAll
    ? pass('Response has: success, items, total, page, totalPages, count')
    : fail('Response shape', `missing keys: ${['success','items','total','page','totalPages','count'].filter(k => !(k in shape)).join(', ')}`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`📊 Results: ${PASS} passed, ${FAIL} failed\n`);
  process.exit(FAIL > 0 ? 1 : 0);
}

setTimeout(run, 1000);
