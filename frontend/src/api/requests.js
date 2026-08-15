import api from './axios';

/**
 * Submit a recovery request for an item.
 * @param {string} itemId  - The item being claimed
 * @param {string} message - The requester's ownership claim
 */
export const createRequest = ({ itemId, message }) =>
  api.post('/requests', { itemId, message });

/**
 * Get all requests the current user has sent.
 */
export const fetchSentRequests = () => api.get('/requests/sent');

/**
 * Get all requests received on items the current user reported.
 */
export const fetchReceivedRequests = () => api.get('/requests/received');

/**
 * Accept or reject a recovery request (item owner only).
 * @param {string} requestId - The request to respond to
 * @param {'accept'|'reject'} action
 */
export const respondToRequest = (requestId, action) =>
  api.patch(`/requests/${requestId}`, { action });
