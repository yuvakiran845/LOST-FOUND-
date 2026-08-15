const mongoose = require('mongoose');
const Item = require('../models/Item');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// ─── Helper ───────────────────────────────────────────────────────────────

// mongoose.Types.ObjectId.isValid() returns true for any 12-char string (a quirk).
// We only want to accept proper 24-character hex ObjectIds.
const isValidId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

// ─── Create Item ──────────────────────────────────────────────────────────
/**
 * @route   POST /api/items
 * @access  Protected
 * @desc    Report a new lost or found item
 */
const createItem = async (req, res) => {
  const { title, description, category, type, location, date } = req.body;

  // ── Validation ──
  if (!title?.trim())       return res.status(400).json({ success: false, message: 'Title is required.' });
  if (!description?.trim()) return res.status(400).json({ success: false, message: 'Description is required.' });
  if (!category)            return res.status(400).json({ success: false, message: 'Category is required.' });
  if (!type)                return res.status(400).json({ success: false, message: 'Type (LOST or FOUND) is required.' });
  if (!location?.trim())    return res.status(400).json({ success: false, message: 'Location is required.' });
  if (!date)                return res.status(400).json({ success: false, message: 'Date is required.' });

  if (!['LOST', 'FOUND'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Type must be LOST or FOUND.' });
  }
  if (!Item.CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `Invalid category: ${category}` });
  }

  // ── Image Upload (optional — skip gracefully if Cloudinary not configured) ──
  let image = { url: null, publicId: null };

  if (req.file) {
    try {
      image = await uploadToCloudinary(req.file.buffer);
    } catch (uploadError) {
      // Cloudinary not configured or upload failed — save item without image.
      // This allows the app to work in dev without Cloudinary credentials.
      console.warn('[createItem] Image upload skipped:', uploadError.message);
    }
  }

  // ── Create Item ──
  // reportedBy comes from req.user (set by protect middleware) — user cannot fake this
  const item = await Item.create({
    title:       title.trim(),
    description: description.trim(),
    category,
    type,
    location:    location.trim(),
    date,
    image,
    reportedBy:  req.user._id,
  });

  res.status(201).json({
    success: true,
    message: `${type === 'LOST' ? 'Lost' : 'Found'} item reported successfully.`,
    item,
  });
};

// ─── Get All Items (with Search, Filter, Sort, Pagination) ───────────────
/**
 * @route   GET /api/items
 * @access  Public
 * @desc    Get items with optional: search, type, category, location,
 *          fromDate, toDate, sort, page, limit
 *
 * Example:
 *   GET /api/items?search=wallet&type=LOST&category=Wallet&page=1&limit=12
 */
const getItems = async (req, res) => {
  const {
    search, type, category, location,
    fromDate, toDate, sort, page, limit,
  } = req.query;

  // ── Build query ──────────────────────────────────────────────────────────
  const query = {};

  // Type filter — must be LOST or FOUND
  if (type && ['LOST', 'FOUND'].includes(type.toUpperCase())) {
    query.type = type.toUpperCase();
  }

  // Category filter — must be in the controlled list
  if (category && Item.CATEGORIES.includes(category)) {
    query.category = category;
  }

  // Location filter — case-insensitive partial match
  if (location?.trim()) {
    query.location = { $regex: location.trim(), $options: 'i' };
  }

  // Date range filter — gracefully ignores invalid dates
  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) {
      const from = new Date(fromDate);
      if (!isNaN(from)) query.date.$gte = from;
    }
    if (toDate) {
      const to = new Date(toDate);
      if (!isNaN(to)) {
        to.setHours(23, 59, 59, 999); // include the entire end day
        query.date.$lte = to;
      }
    }
    // If both dates were invalid, remove the empty date filter
    if (Object.keys(query.date).length === 0) delete query.date;
  }

  // Keyword search — case-insensitive regex across title, description, category, location
  if (search?.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [
      { title:       regex },
      { description: regex },
      { category:    regex },
      { location:    regex },
    ];
  }

  // ── Sort ─────────────────────────────────────────────────────────────────
  const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  // ── Pagination ────────────────────────────────────────────────────────────
  const pageNum  = Math.max(1, parseInt(page)  || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
  const skip     = (pageNum - 1) * limitNum;

  // Run query and count in parallel
  const [items, total] = await Promise.all([
    Item.find(query)
      .populate('reportedBy', 'name')
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum),
    Item.countDocuments(query),
  ]);

  res.json({
    success:    true,
    count:      items.length,
    total,
    page:       pageNum,
    totalPages: Math.ceil(total / limitNum),
    items,
  });
};

// ─── Get My Items ─────────────────────────────────────────────────────────
/**
 * @route   GET /api/items/my
 * @access  Protected
 * @desc    Get all items reported by the logged-in user
 *
 * IMPORTANT: This route must be registered BEFORE /:id in the router
 * so that "my" is not treated as a MongoDB ObjectId.
 */
const getMyItems = async (req, res) => {
  const items = await Item.find({ reportedBy: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: items.length,
    items,
  });
};

// ─── Get Single Item ──────────────────────────────────────────────────────
/**
 * @route   GET /api/items/:id
 * @access  Public
 */
const getItemById = async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid item ID.' });
  }

  const item = await Item.findById(req.params.id)
    .populate('reportedBy', 'name email');

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found.' });
  }

  res.json({ success: true, item });
};

// ─── Update Item ──────────────────────────────────────────────────────────
/**
 * @route   PUT /api/items/:id
 * @access  Protected (owner only)
 */
const updateItem = async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid item ID.' });
  }

  const item = await Item.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found.' });
  }

  // ── Ownership Check ── (critical security check)
  if (item.reportedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized. You can only edit your own items.',
    });
  }

  const { title, description, category, location, date, status } = req.body;

  // Only update fields that were actually sent
  if (title?.trim())       item.title       = title.trim();
  if (description?.trim()) item.description = description.trim();
  if (location?.trim())    item.location    = location.trim();
  if (date)                item.date        = date;

  if (category) {
    if (!Item.CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid category: ${category}` });
    }
    item.category = category;
  }

  // Allow updating status to MATCHED or RETURNED (Phase 6 will handle this more formally)
  if (status) {
    const validStatuses = ['LOST', 'FOUND', 'MATCHED', 'RETURNED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    item.status = status;
  }

  // ── Image Update (optional — skip gracefully if Cloudinary fails) ──
  if (req.file) {
    // Delete old image from Cloudinary if one exists
    if (item.image?.publicId) {
      try { await deleteFromCloudinary(item.image.publicId); } catch (_) {}
    }
    try {
      item.image = await uploadToCloudinary(req.file.buffer);
    } catch (uploadError) {
      console.warn('[updateItem] Image upload skipped:', uploadError.message);
      // Keep existing image, don't block the save
    }
  }

  const updated = await item.save();

  res.json({
    success: true,
    message: 'Item updated successfully.',
    item: updated,
  });
};

// ─── Delete Item ──────────────────────────────────────────────────────────
/**
 * @route   DELETE /api/items/:id
 * @access  Protected (owner only)
 */
const deleteItem = async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid item ID.' });
  }

  const item = await Item.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found.' });
  }

  // ── Ownership Check ──
  if (item.reportedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized. You can only delete your own items.',
    });
  }

  // Delete image from Cloudinary (best-effort — don't block deletion if this fails)
  if (item.image?.publicId) {
    await deleteFromCloudinary(item.image.publicId);
  }

  await Item.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Item deleted successfully.' });
};

module.exports = {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
};
