const mongoose = require('mongoose');
const Item = require('../models/Item');
const { calculateMatchScore, getMatchLabel } = require('../services/matchingService');

const MATCH_THRESHOLD = 50; // only return matches with score >= 50
const isValidId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

/**
 * @route   GET /api/items/:id/matches
 * @access  Public
 * @desc    Find potential matches for a given item.
 *
 * Algorithm:
 *   1. Load the requested item (must exist and not be RETURNED)
 *   2. Find all items of the OPPOSITE type that are not RETURNED
 *   3. Score each candidate using the matching service
 *   4. Filter out candidates with score < MATCH_THRESHOLD
 *   5. Sort by score descending (best first)
 *   6. Return results with score + reasons
 */
const getMatches = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid item ID.' });
  }

  const item = await Item.findById(id).populate('reportedBy', 'name');

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found.' });
  }

  // Determine which type to look for (opposite of the current item)
  const oppositeType = item.type === 'LOST' ? 'FOUND' : 'LOST';

  // Fetch candidate items:
  //  - opposite type
  //  - not RETURNED (already resolved)
  //  - not the item itself (safety check)
  const candidates = await Item.find({
    type:   oppositeType,
    status: { $ne: 'RETURNED' },
    _id:    { $ne: item._id },
  }).populate('reportedBy', 'name');

  // Score each candidate
  const scored = candidates
    .map((candidate) => {
      const { score, reasons } = calculateMatchScore(item, candidate);
      return { item: candidate, score, reasons };
    })
    .filter(({ score }) => score >= MATCH_THRESHOLD) // remove low-confidence
    .sort((a, b) => b.score - a.score);              // best match first

  res.json({
    success: true,
    referenceItem: {
      _id:      item._id,
      title:    item.title,
      type:     item.type,
      category: item.category,
    },
    matchCount: scored.length,
    matches: scored.map(({ item: matched, score, reasons }) => ({
      item:  matched,
      score,
      label: getMatchLabel(score),
      reasons,
    })),
  });
};

module.exports = { getMatches };
