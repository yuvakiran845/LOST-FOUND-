const mongoose = require('mongoose');

/**
 * Request — a recovery claim sent by a user to the reporter of an item.
 *
 * Flow:
 *   Requester visits an item → clicks "Request Recovery" → fills in a message
 *   describing why they believe the item is theirs → submits.
 *
 *   The item reporter sees the request in their "Received" inbox.
 *   They can ACCEPT (marks item as RETURNED and the requester is notified)
 *   or REJECT the request.
 */
const requestSchema = new mongoose.Schema(
  {
    // The item being claimed
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
    },

    // The user who is claiming this item (not the reporter)
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
    },

    // The user who reported the item (denormalized for fast queries)
    // Set automatically from item.reportedBy when the request is created
    itemOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Item owner is required'],
    },

    // The requester's ownership claim — helps the reporter decide
    message: {
      type: String,
      required: [true, 'A message describing your claim is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    // Current state of the request
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────
// Fast lookup for "requests I sent" and "requests on my items"
requestSchema.index({ requester: 1, createdAt: -1 });
requestSchema.index({ itemOwner: 1,  createdAt: -1 });
requestSchema.index({ item: 1 });

// Prevent duplicate requests: one requester per item
requestSchema.index({ item: 1, requester: 1 }, { unique: true });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
