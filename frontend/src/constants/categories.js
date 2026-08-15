/**
 * Shared constants used across multiple frontend pages.
 * These must match exactly what the backend Item model accepts.
 */

export const CATEGORIES = [
  'ID Card',
  'Wallet',
  'Phone',
  'Laptop',
  'Bag',
  'Books',
  'Keys',
  'Earphones',
  'Charger',
  'Watch',
  'Documents',
  'Other',
];

export const ITEM_TYPES = {
  LOST:  'LOST',
  FOUND: 'FOUND',
};

export const STATUS_LABELS = {
  LOST:     { label: 'Lost',     className: 'badge-lost'    },
  FOUND:    { label: 'Found',    className: 'badge-found'   },
  MATCHED:  { label: 'Matched',  className: 'badge-matched' },
  RETURNED: { label: 'Returned', className: 'badge-returned'},
};

// Category emoji icons for visual flair in cards
export const CATEGORY_ICONS = {
  'ID Card':   '🪪',
  'Wallet':    '👛',
  'Phone':     '📱',
  'Laptop':    '💻',
  'Bag':       '🎒',
  'Books':     '📚',
  'Keys':      '🔑',
  'Earphones': '🎧',
  'Charger':   '🔌',
  'Watch':     '⌚',
  'Documents': '📄',
  'Other':     '📦',
};
