import api from './axios';

export const fetchAdminStats        = ()           => api.get('/admin/stats');
export const fetchAdminItems        = (params = {}) => api.get('/admin/items',    { params });
export const fetchAdminUsers        = (params = {}) => api.get('/admin/users',    { params });
export const fetchAdminRequests     = (params = {}) => api.get('/admin/requests', { params });
export const adminDeleteItem        = (id)          => api.delete(`/admin/items/${id}`);
export const adminUpdateItemStatus  = (id, status)  => api.patch(`/admin/items/${id}/status`, { status });
