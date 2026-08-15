import api from './axios';

// Fetch potential matches for an item by its ID
export const fetchMatches = (itemId) => api.get(`/items/${itemId}/matches`);
