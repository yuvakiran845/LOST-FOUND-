/**
 * Phase 3 Item API Test Script
 * Run: node test-items.js
 * Requires: server running on port 5000 with MongoDB connected
 */

const http = require('http');

const BASE = 'http://localhost:5000';
let PASS = 0, FAIL = 0;
let TOKEN_A = '', TOKEN_B = '';
let ITEM_ID = '';

// ─── HTTP Helper ──────────────────────────────────────────────────────────
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

// ─── Tests ────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🧪 CampusConnect — Phase 3 Item API Tests\n');

  // ── Setup: Create two users ──────────────────────────────────────────
  section('SETUP — Create Test Users');
  const ts = Date.now();

  let r = await request('POST', '/api/auth/register', {
    name: 'User A', email: `usera_${ts}@test.dev`, password: 'pass1234',
  });
  if (r.status === 201) { TOKEN_A = r.body.token; pass('User A registered'); }
  else fail('User A register', `${r.status}: ${r.body.message}`);

  r = await request('POST', '/api/auth/register', {
    name: 'User B', email: `userb_${ts}@test.dev`, password: 'pass1234',
  });
  if (r.status === 201) { TOKEN_B = r.body.token; pass('User B registered'); }
  else fail('User B register', `${r.status}: ${r.body.message}`);

  // ── Create Item — Validation ─────────────────────────────────────────
  section('CREATE ITEM — Validation');

  r = await request('POST', '/api/items', { title: '', category: 'Phone', type: 'LOST', location: 'Library', date: '2025-01-01', description: 'test' }, TOKEN_A);
  r.status === 400 ? pass('Missing title → 400') : fail('Missing title', `${r.status}: ${r.body.message}`);

  r = await request('POST', '/api/items', { title: 'Test', category: 'InvalidCat', type: 'LOST', location: 'Library', date: '2025-01-01', description: 'test' }, TOKEN_A);
  r.status === 400 ? pass('Invalid category → 400') : fail('Invalid category', `${r.status}: ${r.body.message}`);

  r = await request('POST', '/api/items', { title: 'Test', category: 'Phone', type: 'WHATEVER', location: 'Library', date: '2025-01-01', description: 'test' }, TOKEN_A);
  r.status === 400 ? pass('Invalid type → 400') : fail('Invalid type', `${r.status}: ${r.body.message}`);

  r = await request('POST', '/api/items', { title: 'Test', category: 'Phone', type: 'LOST', location: 'Library', date: '2025-01-01', description: 'test' });
  r.status === 401 ? pass('No auth → 401') : fail('No auth', `${r.status}`);

  // ── Create Item — Success ────────────────────────────────────────────
  section('CREATE ITEM — Success');

  r = await request('POST', '/api/items', {
    title: 'Blue Wallet', category: 'Wallet', type: 'LOST',
    location: 'CS Block', date: '2025-01-15', description: 'Blue leather wallet with ID card',
  }, TOKEN_A);
  if (r.status === 201 && r.body.item?._id) {
    ITEM_ID = r.body.item._id;
    pass(`Lost item created → 201 (id: ${ITEM_ID.slice(-6)})`);
  } else fail('Create lost item', `${r.status}: ${JSON.stringify(r.body)}`);

  r = await request('POST', '/api/items', {
    title: 'Found Keys', category: 'Keys', type: 'FOUND',
    location: 'Library', date: '2025-01-16', description: 'Black key ring with 3 keys',
  }, TOKEN_B);
  r.status === 201 ? pass('Found item created → 201') : fail('Create found item', `${r.status}`);

  // ── GET All Items ────────────────────────────────────────────────────
  section('GET /api/items — Filters');

  r = await request('GET', '/api/items');
  r.status === 200 && Array.isArray(r.body.items)
    ? pass(`Get all items → 200 (${r.body.count} items)`)
    : fail('Get all', `${r.status}`);

  r = await request('GET', '/api/items?type=LOST');
  r.status === 200 && r.body.items.every(i => i.type === 'LOST')
    ? pass('Filter type=LOST → all LOST')
    : fail('Filter type=LOST', `got items with mixed types`);

  r = await request('GET', '/api/items?type=FOUND');
  r.status === 200 && r.body.items.every(i => i.type === 'FOUND')
    ? pass('Filter type=FOUND → all FOUND')
    : fail('Filter type=FOUND', `${r.status}`);

  r = await request('GET', '/api/items?category=Wallet');
  r.status === 200 && r.body.items.every(i => i.category === 'Wallet')
    ? pass('Filter category=Wallet')
    : fail('Filter category', `${r.status}`);

  // ── GET My Items ─────────────────────────────────────────────────────
  section('GET /api/items/my');

  r = await request('GET', '/api/items/my', null, TOKEN_A);
  if (r.status === 200 && r.body.items.every(i => i.reportedBy)) {
    pass(`My items → 200 (${r.body.count} items for User A)`);
  } else fail('My items', `${r.status}: ${JSON.stringify(r.body)}`);

  r = await request('GET', '/api/items/my');
  r.status === 401 ? pass('My items without auth → 401') : fail('My items no auth', `${r.status}`);

  // ── GET Single Item ──────────────────────────────────────────────────
  section('GET /api/items/:id');

  r = await request('GET', `/api/items/${ITEM_ID}`);
  r.status === 200 && r.body.item?._id === ITEM_ID
    ? pass('Get by ID → 200')
    : fail('Get by ID', `${r.status}`);

  r = await request('GET', '/api/items/invalidid123');
  r.status === 400 ? pass('Invalid ID → 400') : fail('Invalid ID', `${r.status}`);

  r = await request('GET', '/api/items/664f1b2c3d4e5f6a7b8c9d0e');
  r.status === 404 ? pass('Not found → 404') : fail('Not found', `${r.status}`);

  // ── Update Item — Ownership ──────────────────────────────────────────
  section('PUT /api/items/:id — Ownership');

  r = await request('PUT', `/api/items/${ITEM_ID}`, { title: 'Updated Wallet' }, TOKEN_B);
  r.status === 403 ? pass('Non-owner update → 403 Forbidden') : fail('Non-owner update', `${r.status}: ${r.body.message}`);

  r = await request('PUT', `/api/items/${ITEM_ID}`, { title: 'Updated Blue Wallet', location: 'Main Gate' }, TOKEN_A);
  r.status === 200 && r.body.item?.title === 'Updated Blue Wallet'
    ? pass('Owner update → 200')
    : fail('Owner update', `${r.status}: ${JSON.stringify(r.body)}`);

  // ── Delete Item — Ownership ──────────────────────────────────────────
  section('DELETE /api/items/:id — Ownership');

  r = await request('DELETE', `/api/items/${ITEM_ID}`, null, TOKEN_B);
  r.status === 403 ? pass('Non-owner delete → 403 Forbidden') : fail('Non-owner delete', `${r.status}`);

  r = await request('DELETE', `/api/items/${ITEM_ID}`, null, TOKEN_A);
  r.status === 200 ? pass('Owner delete → 200') : fail('Owner delete', `${r.status}: ${r.body.message}`);

  r = await request('GET', `/api/items/${ITEM_ID}`);
  r.status === 404 ? pass('Deleted item → 404') : fail('After delete', `${r.status}`);

  // ── Summary ──────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`📊 Results: ${PASS} passed, ${FAIL} failed\n`);
  process.exit(FAIL > 0 ? 1 : 0);
}

setTimeout(run, 1000);
