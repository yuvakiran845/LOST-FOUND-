import api from './axios';

/**
 * All API calls related to Items.
 * Centralised here so pages just call these functions
 * instead of writing axios calls inline.
 */

// Get all items with optional filters
// Supports: search, type, category, location, fromDate, toDate, sort, page, limit
export const fetchItems = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search)    params.append('search',    filters.search);
  if (filters.type)      params.append('type',      filters.type);
  if (filters.category)  params.append('category',  filters.category);
  if (filters.location)  params.append('location',  filters.location);
  if (filters.fromDate)  params.append('fromDate',  filters.fromDate);
  if (filters.toDate)    params.append('toDate',    filters.toDate);
  if (filters.sort)      params.append('sort',      filters.sort);
  if (filters.page)      params.append('page',      filters.page);
  if (filters.limit)     params.append('limit',     filters.limit);
  const qs = params.toString();
  return api.get(`/items${qs ? `?${qs}` : ''}`);
};

// Get the current user's items
export const fetchMyItems = () => api.get('/items/my');

// Get a single item by ID
export const fetchItemById = (id) => api.get(`/items/${id}`);

/**
 * Create a new item (lost or found).
 * Uses FormData to support optional image upload.
 *
 * @param {Object} data - { title, description, category, type, location, date, image }
 */
export const createItem = (data) => {
  const formData = new FormData();
  formData.append('title',       data.title);
  formData.append('description', data.description);
  formData.append('category',    data.category);
  formData.append('type',        data.type);
  formData.append('location',    data.location);
  formData.append('date',        data.date);
  if (data.image) formData.append('image', data.image);

  // Do NOT set Content-Type manually — browser sets it with correct boundary for multipart
  return api.post('/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * Update an existing item.
 * Also uses FormData to support optional image replacement.
 */
export const updateItem = (id, data) => {
  const formData = new FormData();
  if (data.title)       formData.append('title',       data.title);
  if (data.description) formData.append('description', data.description);
  if (data.category)    formData.append('category',    data.category);
  if (data.location)    formData.append('location',    data.location);
  if (data.date)        formData.append('date',        data.date);
  if (data.status)      formData.append('status',      data.status);
  if (data.image)       formData.append('image',       data.image);

  return api.put(`/items/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Delete an item by ID
export const deleteItem = (id) => api.delete(`/items/${id}`);
