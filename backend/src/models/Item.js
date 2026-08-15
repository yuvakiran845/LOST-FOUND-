const mongoose = require('mongoose');

// Controlled list of valid categories — shared with the frontend via constants
const CATEGORIES = [
  'ID Card', 'Wallet', 'Phone', 'Laptop', 'Bag',
  'Books', 'Keys', 'Earphones', 'Charger', 'Watch',
  'Documents', 'Other',
];

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },

    // LOST or FOUND — determines the initial status
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['LOST', 'FOUND'],
        message: 'Type must be LOST or FOUND',
      },
    },

    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },

    date: {
      type: Date,
      required: [true, 'Date is required'],
    },

    // Cloudinary image — optional
    // We store both the URL (for display) and publicId (for deletion)
    image: {
      url:      { type: String, default: null },
      publicId: { type: String, default: null },
    },

    // Status follows the type:
    //   LOST  → LOST → MATCHED → RETURNED
    //   FOUND → FOUND → MATCHED → RETURNED
    status: {
      type: String,
      enum: ['LOST', 'FOUND', 'MATCHED', 'RETURNED'],
      // Default is set to the item's type in the pre-save hook below
    },

    // Reference to the user who reported this item
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────
// These improve query performance for the most common filter combinations.
itemSchema.index({ type: 1, category: 1 });  // type + category filter
itemSchema.index({ createdAt: -1 });          // default sort (newest first)
itemSchema.index({ location: 1 });            // location filter

// ─── Pre-save Hook ────────────────────────────────────────────────────────
// Set default status based on type when first creating an item
itemSchema.pre('save', function (next) {
  if (this.isNew && !this.status) {
    this.status = this.type; // LOST item → status = 'LOST', FOUND → 'FOUND'
  }
  next();
});

// Export CATEGORIES so the controller can reuse the same list for validation
itemSchema.statics.CATEGORIES = CATEGORIES;

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
