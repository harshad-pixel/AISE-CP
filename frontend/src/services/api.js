import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ---- Projects ----
export const projectApi = {
  list: () => api.get('/projects/'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}

// ---- Requirements ----
export const requirementApi = {
  list: (params = {}) => api.get('/requirements/', { params }),
  get: (id) => api.get(`/requirements/${id}`),
  create: (data) => api.post('/requirements/', data),
  bulkCreate: (data) => api.post('/requirements/bulk', data),
  update: (id, data) => api.put(`/requirements/${id}`, data),
  delete: (id) => api.delete(`/requirements/${id}`),
}

// ---- Analysis ----
export const analysisApi = {
  run: (data) => api.post('/analysis/run', data),
  prioritize: (data) => api.post('/analysis/prioritize', data),
  insights: (projectId) => api.get(`/analysis/insights/${projectId}`),
  history: (requirementId) => api.get(`/analysis/history/${requirementId}`),
}

export default api
