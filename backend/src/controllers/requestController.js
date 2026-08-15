const Request = require('../models/Request');
const Item    = require('../models/Item');
const {
  sendNewRequestEmail,
  sendRequestAcceptedEmail,
  sendRequestRejectedEmail,
} = require('../services/emailService');

// ─── Helper ───────────────────────────────────────────────────────────────
const isValidId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

// ─── Create Request ───────────────────────────────────────────────────────
/**
 * @route   POST /api/requests
 * @access  Protected
 * @body    { itemId, message }
 * @desc    Submit a recovery claim for an item.
 *
 * Rules:
 *  - Item must exist and not be RETURNED
 *  - Requester cannot be the item's reporter (can't claim your own item)
 *  - Only one pending/accepted request per (item, requester) pair
 */
const createRequest = async (req, res) => {
  const { itemId, message } = req.body;

  if (!itemId)        return res.status(400).json({ success: false, message: 'itemId is required.' });
  if (!isValidId(itemId)) return res.status(400).json({ success: false, message: 'Invalid item ID.' });
  if (!message?.trim()) return res.status(400).json({ success: false, message: 'A message is required.' });
  if (message.trim().length > 500) {
    return res.status(400).json({ success: false, message: 'Message cannot exceed 500 characters.' });
  }

  const item = await Item.findById(itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

  if (item.status === 'RETURNED') {
    return res.status(400).json({ success: false, message: 'This item has already been returned.' });
  }

  // Cannot claim your own item
  if (item.reportedBy.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot send a recovery request for your own item.' });
  }

  // Check for duplicate request
  const existing = await Request.findOne({ item: itemId, requester: req.user._id });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: existing.status === 'REJECTED'
        ? 'Your previous request for this item was rejected.'
        : 'You have already sent a recovery request for this item.',
    });
  }

  const request = await Request.create({
    item:      itemId,
    requester: req.user._id,
    itemOwner: item.reportedBy,
    message:   message.trim(),
  });

  await request.populate([
    { path: 'item',      select: 'title type category location' },
    { path: 'requester', select: 'name email' },
    { path: 'itemOwner', select: 'name email' },
  ]);

  // ── Fire-and-forget email to the item owner ──
  sendNewRequestEmail({
    ownerEmail:     request.itemOwner.email,
    ownerName:      request.itemOwner.name,
    requesterName:  request.requester.name,
    itemTitle:      request.item.title,
  });

  res.status(201).json({ success: true, message: 'Recovery request sent.', request });
};

// ─── Get Requests I Sent ──────────────────────────────────────────────────
/**
 * @route   GET /api/requests/sent
 * @access  Protected
 * @desc    Get all recovery requests the current user has sent.
 */
const getMyRequests = async (req, res) => {
  const requests = await Request.find({ requester: req.user._id })
    .populate('item',      'title type category location status image')
    .populate('itemOwner', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: requests.length, requests });
};

// ─── Get Requests Received (on my items) ─────────────────────────────────
/**
 * @route   GET /api/requests/received
 * @access  Protected
 * @desc    Get all recovery requests for items reported by the current user.
 */
const getRequestsForMyItems = async (req, res) => {
  const requests = await Request.find({ itemOwner: req.user._id })
    .populate('item',      'title type category location status image')
    .populate('requester', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: requests.length, requests });
};

// ─── Respond to Request ───────────────────────────────────────────────────
/**
 * @route   PATCH /api/requests/:id
 * @access  Protected (item owner only)
 * @body    { action: 'accept' | 'reject' }
 * @desc    Accept or reject a recovery request.
 *
 * On ACCEPT → item status is set to RETURNED
 * On REJECT → request status is set to REJECTED, item unchanged
 */
const respondToRequest = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!isValidId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid request ID.' });
  }

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: "action must be 'accept' or 'reject'." });
  }

  const request = await Request.findById(id).populate('item');

  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  // Only the item owner can respond
  if (request.itemOwner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized. Only the item reporter can respond.' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({
      success: false,
      message: `This request has already been ${request.status.toLowerCase()}.`,
    });
  }

  if (action === 'accept') {
    request.status = 'ACCEPTED';

    // Mark the item as RETURNED
    const item = await Item.findById(request.item._id);
    if (item) {
      item.status = 'RETURNED';
      await item.save();
    }

    // Reject all other PENDING requests for the same item
    await Request.updateMany(
      { item: request.item._id, _id: { $ne: request._id }, status: 'PENDING' },
      { $set: { status: 'REJECTED' } }
    );
  } else {
    request.status = 'REJECTED';
  }

  await request.save();

  await request.populate([
    { path: 'item',      select: 'title type category location status' },
    { path: 'requester', select: 'name email' },
  ]);

  // ── Fire-and-forget email to the requester ──
  if (action === 'accept') {
    sendRequestAcceptedEmail({
      requesterEmail: request.requester.email,
      requesterName:  request.requester.name,
      itemTitle:      request.item.title,
      itemOwnerName:  req.user.name,
    });
  } else {
    sendRequestRejectedEmail({
      requesterEmail: request.requester.email,
      requesterName:  request.requester.name,
      itemTitle:      request.item.title,
    });
  }

  res.json({
    success: true,
    message: action === 'accept' ? 'Request accepted. Item marked as returned.' : 'Request rejected.',
    request,
  });
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequestsForMyItems,
  respondToRequest,
};
