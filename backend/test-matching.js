/**
 * Phase 5 — Matching Service Unit Tests
 * Run: node test-matching.js
 * 
 * These test the pure scoring functions directly — no HTTP, no DB needed.
 */

const {
  calculateMatchScore,
  _tokenize,
  _scoreCategory,
  _scoreLocation,
  _scoreDate,
  _scoreKeywords,
} = require('./src/services/matchingService');

let PASS = 0, FAIL = 0;

function pass(label) { console.log(`  ✅ PASS: ${label}`); PASS++; }
function fail(label, d) { console.log(`  ❌ FAIL: ${label} — ${d}`); FAIL++; }
function section(t) { console.log(`\n── ${t} ${'─'.repeat(48 - t.length)}`); }
function assertEqual(actual, expected, label) {
  actual === expected ? pass(label) : fail(label, `expected ${expected}, got ${actual}`);
}

// ── Shared test fixtures ──────────────────────────────────────────────────

const lostWallet = {
  title: 'Blue Leather Wallet',
  description: 'Blue leather wallet with college ID card inside',
  category: 'Wallet',
  location: 'Library',
  date: new Date('2026-08-01'),
  type: 'LOST',
};

const foundWallet = {
  title: 'Black wallet found',
  description: 'Black leather wallet found near library entrance',
  category: 'Wallet',
  location: 'Library',
  date: new Date('2026-08-01'),
  type: 'FOUND',
};

const foundPhone = {
  title: 'iPhone found',
  description: 'Black iPhone with cracked screen',
  category: 'Phone',
  location: 'Canteen',
  date: new Date('2026-08-01'),
  type: 'FOUND',
};

// ── Category Scoring ──────────────────────────────────────────────────────

section('CATEGORY SCORING');
assertEqual(_scoreCategory('Wallet', 'Wallet'), 40, 'Same category → 40');
assertEqual(_scoreCategory('Wallet', 'Phone'),   0, 'Different category → 0');
assertEqual(_scoreCategory('Wallet', ''),         0, 'Empty category → 0');

// ── Location Scoring ──────────────────────────────────────────────────────

section('LOCATION SCORING');
assertEqual(_scoreLocation('Library',        'Library'),         30, 'Exact location → 30');
assertEqual(_scoreLocation('library',        'LIBRARY'),         30, 'Case-insensitive exact → 30');
assertEqual(_scoreLocation('College Library','Library'),         15, 'Token overlap → 15');
assertEqual(_scoreLocation('Canteen',        'Library'),          0, 'No overlap → 0');
assertEqual(_scoreLocation('',               'Library'),          0, 'Empty location → 0');

// ── Date Scoring ──────────────────────────────────────────────────────────

section('DATE SCORING');
assertEqual(_scoreDate('2026-08-01', '2026-08-01'), 20, 'Same date → 20');
assertEqual(_scoreDate('2026-08-01', '2026-08-02'), 20, '1 day apart → 20');
assertEqual(_scoreDate('2026-08-01', '2026-08-03'), 10, '2 days apart → 10');
assertEqual(_scoreDate('2026-08-01', '2026-08-05'),  0, '4 days apart → 0');
assertEqual(_scoreDate('',           '2026-08-01'),  0, 'Empty date → 0');
assertEqual(_scoreDate('not-a-date', '2026-08-01'),  0, 'Invalid date → 0');

// ── Keyword Scoring ───────────────────────────────────────────────────────

section('KEYWORD SCORING');
// "leather" and "wallet" overlap (after stop words removed)
assertEqual(
  _scoreKeywords(
    { title: 'Blue Leather Wallet', description: 'with college ID' },
    { title: 'Black wallet',        description: 'leather wallet found' }
  ),
  10, 'Overlapping keywords → 10'
);
assertEqual(
  _scoreKeywords(
    { title: 'iPhone',       description: 'cracked screen black' },
    { title: 'Blue Wallet',  description: 'found near entrance' }
  ),
  0, 'No keyword overlap → 0'
);

// ── calculateMatchScore — Full Scenarios ──────────────────────────────────

section('FULL SCORE — Perfect Match');
{
  const { score, reasons } = calculateMatchScore(lostWallet, foundWallet);
  score >= 90
    ? pass(`Perfect match (category+location+date+keywords) → ${score} points`)
    : fail('Perfect match', `got ${score}, expected >= 90`);
  reasons.length >= 4
    ? pass(`All 4 reasons returned: ${reasons.join(', ')}`)
    : fail('Reasons count', `got ${reasons.length}: ${reasons.join(', ')}`);
}

section('FULL SCORE — Category Only');
{
  const { score, reasons } = calculateMatchScore(
    { title: 'Wallet', description: 'wallet', category: 'Wallet', location: 'Library', date: '2026-01-01' },
    { title: 'phone charger', description: 'charger cable', category: 'Wallet', location: 'Canteen', date: '2026-06-01' }
  );
  assertEqual(score, 40, 'Category only → 40');
  assertEqual(reasons.length, 1, 'Only 1 reason');
}

section('FULL SCORE — Category + Location');
{
  const { score } = calculateMatchScore(
    { title: 'test', description: 'item', category: 'Phone', location: 'Library', date: '2026-01-01' },
    { title: 'gadget', description: 'device', category: 'Phone', location: 'Library', date: '2026-06-01' }
  );
  assertEqual(score, 70, 'Category + exact location → 70');
}

section('FULL SCORE — Category + Date');
{
  const { score } = calculateMatchScore(
    { title: 'item', description: 'stuff', category: 'Keys', location: 'Canteen', date: '2026-08-01' },
    { title: 'thing', description: 'stuff', category: 'Keys', location: 'Library', date: '2026-08-01' }
  );
  // Category (40) + Date (20) = 60, possibly + keywords (10) if 'stuff' overlaps
  score >= 60
    ? pass(`Category + date → ${score} (≥ 60)`)
    : fail('Category + date', `got ${score}`);
}

section('FULL SCORE — Category + Keywords');
{
  const { score } = calculateMatchScore(
    { title: 'Black Leather Wallet', description: 'leather wallet', category: 'Wallet', location: 'Gate', date: '2026-01-01' },
    { title: 'Leather Wallet found', description: 'black wallet', category: 'Wallet', location: 'Canteen', date: '2026-06-01' }
  );
  // Category (40) + keywords (10) = 50
  score >= 50
    ? pass(`Category + keywords → ${score} (≥ 50)`)
    : fail('Category + keywords', `got ${score}`);
}

section('THRESHOLD');
{
  // Score below threshold — no category match, different location, far dates
  const { score } = calculateMatchScore(
    { title: 'wallet', description: 'wallet', category: 'Wallet', location: 'Library', date: '2026-01-01' },
    { title: 'phone',  description: 'phone',  category: 'Phone',  location: 'Canteen', date: '2026-08-01' }
  );
  score < 50
    ? pass(`Low-confidence match → ${score} (below 50 threshold)`)
    : fail('Below threshold', `got ${score}, expected < 50`);
}

section('TOKENIZER');
{
  const tokens = _tokenize('The black leather Wallet, with an ID card!');
  // 'the', 'with', 'an' should be removed as stop words
  // 'black', 'leather', 'wallet', 'card' should remain (length > 2 and not stop words)
  const arr = [...tokens];
  const hasWallet = arr.includes('wallet');
  const hasNoStopWords = !arr.includes('the') && !arr.includes('with') && !arr.includes('an');
  hasWallet ? pass('Tokenizer keeps "wallet"') : fail('Tokenizer', 'missing "wallet"');
  hasNoStopWords ? pass('Tokenizer removes stop words (the, with, an)') : fail('Stop words', `still has: ${arr.join(', ')}`);
}

// ── Summary ───────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(55)}`);
console.log(`📊 Results: ${PASS} passed, ${FAIL} failed\n`);
process.exit(FAIL > 0 ? 1 : 0);
