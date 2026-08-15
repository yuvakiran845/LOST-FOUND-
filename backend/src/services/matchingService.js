/**
 * matchingService.js
 *
 * Rule-based scoring algorithm to find potential matches between
 * LOST and FOUND item reports.
 *
 * Scoring breakdown (max 100 points):
 *   Category  → 40 pts  (exact match only)
 *   Location  → 30 pts  (exact) / 15 pts (token overlap)
 *   Date      → 20 pts  (≤1 day apart) / 10 pts (2 days) / 0 (>2 days)
 *   Keywords  → 10 pts  (meaningful word overlap in title+description)
 *
 * These functions are kept PURE (no DB calls, no side effects)
 * so they are easy to test and reason about.
 */

// ─── Stop Words ───────────────────────────────────────────────────────────
// Common English words that don't help identify an item
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'my', 'and', 'near', 'with', 'at', 'in', 'on',
  'was', 'it', 'to', 'of', 'i', 'found', 'lost', 'for', 'or', 'this',
  'that', 'from', 'has', 'have', 'been', 'by', 'its', 'some', 'are',
  'not', 'he', 'she', 'we', 'they', 'you', 'left', 'also', 'had',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Tokenize a string into a set of meaningful lowercase words.
 * Strips punctuation, lowercases, removes stop words and short words.
 */
function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

/**
 * Score category match.
 * Awards 40 points only when categories are exactly equal.
 */
function scoreCategory(catA, catB) {
  return catA === catB ? 40 : 0;
}

/**
 * Score location similarity.
 *
 * Rules:
 *   Exact match (case-insensitive, trimmed) → 30 pts
 *   At least one token in common            → 15 pts
 *   No overlap                              → 0 pts
 */
function scoreLocation(locA, locB) {
  if (!locA || !locB) return 0;
  const a = locA.toLowerCase().trim();
  const b = locB.toLowerCase().trim();

  if (a === b) return 30;

  // Token overlap: split by whitespace and check for shared words
  const tokensA = new Set(a.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const tokensB = new Set(b.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const overlap = [...tokensA].filter((t) => tokensB.has(t));

  return overlap.length > 0 ? 15 : 0;
}

/**
 * Score date proximity.
 *
 * Rules (absolute difference):
 *   0–1 days → 20 pts
 *   2 days   → 10 pts
 *   >2 days  → 0 pts
 */
function scoreDate(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const d1 = new Date(dateA);
  const d2 = new Date(dateB);
  if (isNaN(d1) || isNaN(d2)) return 0;

  const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return 20;
  if (diffDays <= 2) return 10;
  return 0;
}

/**
 * Score keyword overlap between title+description of two items.
 *
 * Tokenizes both texts (removing stop words) and awards 10 points
 * if there is at least one meaningful word in common.
 */
function scoreKeywords(itemA, itemB) {
  const textA = `${itemA.title || ''} ${itemA.description || ''}`;
  const textB = `${itemB.title || ''} ${itemB.description || ''}`;
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  const overlap = [...tokensA].filter((t) => tokensB.has(t));
  return overlap.length > 0 ? 10 : 0;
}

// ─── Main Scoring Function ────────────────────────────────────────────────

/**
 * calculateMatchScore — compare a LOST item against a FOUND item (or vice versa).
 *
 * @param {Object} itemA - The reference item (e.g. a LOST report)
 * @param {Object} itemB - A candidate item of the opposite type
 * @returns {{ score: number, reasons: string[] }}
 *
 * Example:
 *   calculateMatchScore(lostWallet, foundWallet)
 *   → { score: 90, reasons: ['Category matched', 'Location matched', 'Date matched', 'Keywords matched'] }
 */
function calculateMatchScore(itemA, itemB) {
  let score = 0;
  const reasons = [];

  // ── Category (40 pts) ────────────────────────────────────────────────
  const catScore = scoreCategory(itemA.category, itemB.category);
  if (catScore > 0) {
    score += catScore;
    reasons.push('Category matched');
  }

  // ── Location (30 pts max) ────────────────────────────────────────────
  const locScore = scoreLocation(itemA.location, itemB.location);
  if (locScore === 30) {
    score += locScore;
    reasons.push('Location matched');
  } else if (locScore === 15) {
    score += locScore;
    reasons.push('Location nearby');
  }

  // ── Date (20 pts max) ────────────────────────────────────────────────
  const dateScore = scoreDate(itemA.date, itemB.date);
  if (dateScore === 20) {
    score += dateScore;
    reasons.push('Date matched');
  } else if (dateScore === 10) {
    score += dateScore;
    reasons.push('Date close');
  }

  // ── Keywords (10 pts) ────────────────────────────────────────────────
  const kwScore = scoreKeywords(itemA, itemB);
  if (kwScore > 0) {
    score += kwScore;
    reasons.push('Keywords matched');
  }

  return { score, reasons };
}

// ─── Match Label Helper ───────────────────────────────────────────────────

/**
 * Return a human-readable label for a match score.
 * Used by both backend response and frontend display.
 */
function getMatchLabel(score) {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  return 'Possible Match';
}

// Export all helpers so they can be individually unit-tested
module.exports = {
  calculateMatchScore,
  getMatchLabel,
  // Exported for testing only:
  _tokenize:      tokenize,
  _scoreCategory: scoreCategory,
  _scoreLocation: scoreLocation,
  _scoreDate:     scoreDate,
  _scoreKeywords: scoreKeywords,
};
