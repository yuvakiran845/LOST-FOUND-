/**
 * Phase 2 Auth API Test Script
 * Run: node test-auth.js
 * 
 * Tests all auth endpoints and edge cases.
 * Uses Node's built-in http module — no extra dependencies.
 */

const http = require('http');

const BASE = 'http://localhost:5000';
let PASS = 0;
let FAIL = 0;
let savedToken = '';

// ─── Helper ───────────────────────────────────────────────────────────────

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const json = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': json ? Buffer.byteLength(json) : 0,
        ...headers,
      },
    };

    const req = http.request(`${BASE}${path}`, opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (json) req.write(json);
    req.end();
  });
}

function pass(label) {
  console.log(`  ✅ PASS: ${label}`);
  PASS++;
}

function fail(label, detail) {
  console.log(`  ❌ FAIL: ${label} — ${detail}`);
  FAIL++;
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(50 - title.length)}`);
}

// ─── Tests ────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🧪 CampusConnect — Phase 2 Auth API Tests\n');

  // ── 1. Register — Missing fields ──────────────────────────────────────
  section('REGISTER — Validation');

  let r = await request('POST', '/api/auth/register', { name: '', email: 'a@b.com', password: '123456' });
  r.status === 400 && r.body.message
    ? pass('Missing name → 400')
    : fail('Missing name', `got ${r.status}: ${r.body.message}`);

  r = await request('POST', '/api/auth/register', { name: 'Test', email: 'notanemail', password: '123456' });
  r.status === 400
    ? pass('Invalid email → 400')
    : fail('Invalid email', `got ${r.status}: ${r.body.message}`);

  r = await request('POST', '/api/auth/register', { name: 'Test', email: 'test@test.com', password: '123' });
  r.status === 400
    ? pass('Short password → 400')
    : fail('Short password', `got ${r.status}: ${r.body.message}`);

  // ── 2. Register — Success ─────────────────────────────────────────────
  section('REGISTER — Success');

  r = await request('POST', '/api/auth/register', {
    name: 'Test User',
    email: 'testphase2@campusconnect.dev',
    password: 'password123',
  });
  if (r.status === 201 && r.body.token && r.body.user && !r.body.user.password) {
    pass('Valid registration → 201 + token + safe user');
    savedToken = r.body.token;
  } else {
    fail('Valid registration', `got ${r.status}: ${JSON.stringify(r.body)}`);
  }

  // ── 3. Register — Duplicate email ────────────────────────────────────
  section('REGISTER — Duplicate Email');

  r = await request('POST', '/api/auth/register', {
    name: 'Another User',
    email: 'testphase2@campusconnect.dev',
    password: 'password123',
  });
  r.status === 409
    ? pass('Duplicate email → 409 Conflict')
    : fail('Duplicate email', `got ${r.status}: ${r.body.message}`);

  // ── 4. Login — Invalid credentials ───────────────────────────────────
  section('LOGIN — Invalid Credentials');

  r = await request('POST', '/api/auth/login', {
    email: 'notexist@test.com',
    password: 'password123',
  });
  r.status === 401
    ? pass('Non-existent email → 401')
    : fail('Non-existent email', `got ${r.status}: ${r.body.message}`);

  r = await request('POST', '/api/auth/login', {
    email: 'testphase2@campusconnect.dev',
    password: 'wrongpassword',
  });
  r.status === 401
    ? pass('Wrong password → 401')
    : fail('Wrong password', `got ${r.status}: ${r.body.message}`);

  // ── 5. Login — Success ────────────────────────────────────────────────
  section('LOGIN — Success');

  r = await request('POST', '/api/auth/login', {
    email: 'testphase2@campusconnect.dev',
    password: 'password123',
  });
  if (r.status === 200 && r.body.token && r.body.user && !r.body.user.password) {
    pass('Valid login → 200 + token + safe user');
    savedToken = r.body.token; // update token
  } else {
    fail('Valid login', `got ${r.status}: ${JSON.stringify(r.body)}`);
  }

  // ── 6. GET /me — Protected route ─────────────────────────────────────
  section('GET /api/auth/me — Protected Route');

  r = await request('GET', '/api/auth/me', null);
  r.status === 401
    ? pass('No token → 401')
    : fail('No token', `got ${r.status}`);

  r = await request('GET', '/api/auth/me', null, { Authorization: 'Bearer invalidtoken123' });
  r.status === 401
    ? pass('Invalid token → 401')
    : fail('Invalid token', `got ${r.status}`);

  r = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${savedToken}` });
  if (r.status === 200 && r.body.user && !r.body.user.password) {
    pass('Valid token → 200 + safe user (no password)');
  } else {
    fail('Valid token /me', `got ${r.status}: ${JSON.stringify(r.body)}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`📊 Results: ${PASS} passed, ${FAIL} failed\n`);

  process.exit(FAIL > 0 ? 1 : 0);
}

// Wait for server to be ready
setTimeout(run, 2000);
