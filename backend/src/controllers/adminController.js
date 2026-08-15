const User    = require('../models/User');
const Item    = require('../models/Item');
const Request = require('../models/Request');

// ─── Platform Stats ───────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/stats
 * @access  Admin only
 * @desc    Aggregate platform-wide statistics.
 */
const getStats = async (req, res) => {
  const [
    totalUsers,
    totalItems,
    totalRequests,
    lostCount,
    foundCount,
    returnedCount,
    matchedCount,
    pendingRequests,
    acceptedRequests,
    categoryBreakdown,
    recentItems,
  ] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments(),
    Request.countDocuments(),
    Item.countDocuments({ type: 'LOST' }),
    Item.countDocuments({ type: 'FOUND' }),
    Item.countDocuments({ status: 'RETURNED' }),
    Item.countDocuments({ status: 'MATCHED' }),
    Request.countDocuments({ status: 'PENDING' }),
    Request.countDocuments({ status: 'ACCEPTED' }),
    Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Item.find().sort({ createdAt: -1 }).limit(5).populate('reportedBy', 'name email'),
  ]);

  const returnRate = totalItems > 0
    ? Math.round((returnedCount / totalItems) * 100)
    : 0;

  res.json({
    success: true,
    stats: {
      users:           { total: totalUsers },
      items: {
        total:    totalItems,
        lost:     lostCount,
        found:    foundCount,
        returned: returnedCount,
        matched:  matchedCount,
        returnRate,
      },
      requests: {
        total:    totalRequests,
        pending:  pendingRequests,
        accepted: acceptedRequests,
      },
      categoryBreakdown: categoryBreakdown.map((c) => ({ category: c._id, count: c.count })),
      recentItems,
    },
  });
};

// ─── All Items ────────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/items?page=1&limit=20&search=&type=&status=
 * @access  Admin only
 */
const getAllItems = async (req, res) => {
  const { page = 1, limit = 20, search, type, status } = req.query;

  const query = {};
  if (type   && ['LOST', 'FOUND'].includes(type.toUpperCase())) query.type = type.toUpperCase();
  if (status && ['LOST', 'FOUND', 'MATCHED', 'RETURNED'].includes(status.toUpperCase())) {
    query.status = status.toUpperCase();
  }
  if (search?.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ title: regex }, { description: regex }, { location: regex }];
  }

  const pageNum  = Math.max(1, parseInt(page)  || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const skip     = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Item.find(query)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Item.countDocuments(query),
  ]);

  res.json({
    success:    true,
    total,
    page:       pageNum,
    totalPages: Math.ceil(total / limitNum),
    items,
  });
};

// ─── All Users ────────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/users?page=1&limit=20&search=
 * @access  Admin only
 */
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const query = {};
  if (search?.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ name: regex }, { email: regex }];
  }

  const pageNum  = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const skip     = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(query),
  ]);

  // Attach item count per user
  const userIds = users.map((u) => u._id);
  const itemCounts = await Item.aggregate([
    { $match: { reportedBy: { $in: userIds } } },
    { $group: { _id: '$reportedBy', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(itemCounts.map((c) => [c._id.toString(), c.count]));

  res.json({
    success:    true,
    total,
    page:       pageNum,
    totalPages: Math.ceil(total / limitNum),
    users: users.map((u) => ({
      ...u.toObject(),
      itemCount: countMap[u._id.toString()] || 0,
    })),
  });
};

// ─── All Requests ─────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/requests?page=1&limit=20&status=
 * @access  Admin only
 */
const getAllRequests = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status && ['PENDING', 'ACCEPTED', 'REJECTED'].includes(status.toUpperCase())) {
    query.status = status.toUpperCase();
  }

  const pageNum  = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const skip     = (pageNum - 1) * limitNum;

  const [requests, total] = await Promise.all([
    Request.find(query)
      .populate('item',      'title type category status')
      .populate('requester', 'name email')
      .populate('itemOwner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Request.countDocuments(query),
  ]);

  res.json({
    success:    true,
    total,
    page:       pageNum,
    totalPages: Math.ceil(total / limitNum),
    requests,
  });
};

// ─── Delete Item (Admin) ──────────────────────────────────────────────────
/**
 * @route   DELETE /api/admin/items/:id
 * @access  Admin only
 */
const adminDeleteItem = async (req, res) => {
  const { id } = req.params;
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({ success: false, message: 'Invalid item ID.' });
  }

  const item = await Item.findByIdAndDelete(id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

  // Clean up associated requests
  await Request.deleteMany({ item: id });

  res.json({ success: true, message: 'Item deleted by admin.' });
};

// ─── Update Item Status (Admin) ───────────────────────────────────────────
/**
 * @route   PATCH /api/admin/items/:id/status
 * @access  Admin only
 * @body    { status: 'LOST'|'FOUND'|'MATCHED'|'RETURNED' }
 */
const adminUpdateItemStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const VALID = ['LOST', 'FOUND', 'MATCHED', 'RETURNED'];

  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({ success: false, message: 'Invalid item ID.' });
  }
  if (!VALID.includes(status)) {
    return res.status(400).json({ success: false, message: `status must be one of: ${VALID.join(', ')}` });
  }

  const item = await Item.findByIdAndUpdate(id, { status }, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

  res.json({ success: true, message: 'Status updated.', item });
};

module.exports = {
  getStats,
  getAllItems,
  getAllUsers,
  getAllRequests,
  adminDeleteItem,
  adminUpdateItemStatus,
};
