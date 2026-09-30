const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}/api${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `API error: ${response.status}`);
    }

    return data;
  }

  // Health
  health() { return this.request('/health'); }
  healthAi() { return this.request('/health/ai'); }

  // Profile
  getProfile() { return this.request('/profile'); }
  updateProfile(data) { return this.request('/profile', { method: 'PUT', body: data }); }
  getProfiles() { return this.request('/profiles'); }

  // AI Agent
  sendMessage(message, context = {}) {
    return this.request('/ai/agent', {
      method: 'POST',
      body: { message, ...context }
    });
  }

  // Workflows
  getWorkflows(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/workflows${qs ? '?' + qs : ''}`);
  }
  getWorkflow(id) { return this.request(`/workflows/${id}`); }
  updateWorkflow(id, data) { return this.request(`/workflows/${id}`, { method: 'PATCH', body: data }); }
  cancelWorkflow(id) { return this.request(`/workflows/${id}/cancel`, { method: 'POST' }); }

  // Approvals
  getApprovals(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/approvals${qs ? '?' + qs : ''}`);
  }
  approveWorkflow(id, comments) { return this.request(`/approvals/${id}/approve`, { method: 'POST', body: { comments } }); }
  rejectWorkflow(id, comments) { return this.request(`/approvals/${id}/reject`, { method: 'POST', body: { comments } }); }

  // Tasks
  getTasks(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/tasks${qs ? '?' + qs : ''}`);
  }
  updateTask(id, status) { return this.request(`/tasks/${id}`, { method: 'PATCH', body: { status } }); }

  // Dashboard
  getDashboard() { return this.request('/dashboard'); }
  getDashboardActivity() { return this.request('/dashboard/activity'); }
  getDashboardAlerts() { return this.request('/dashboard/alerts'); }

  // Monitor
  getMonitorAlerts() { return this.request('/monitor'); }
  runMonitor() { return this.request('/monitor/run', { method: 'POST' }); }
  resolveAlert(id) { return this.request(`/alerts/${id}/resolve`, { method: 'POST' }); }

  // Google Integrations
  getGoogleStatus() { return this.request('/integrations/google/status'); }
  startGoogleOAuth() { return this.request('/integrations/google/start'); }
  disconnectGoogle() { return this.request('/integrations/google/disconnect', { method: 'POST' }); }

  // Google APIs
  searchDrive(q) { return this.request(`/google/drive/search?q=${encodeURIComponent(q)}`); }
  getCalendarEvents(start, end) { return this.request(`/google/calendar/events?start=${start}&end=${end}`); }
  createCalendarEvent(data) { return this.request('/google/calendar/events', { method: 'POST', body: data }); }
  sendEmail(data) { return this.request('/google/gmail/send', { method: 'POST', body: data }); }
  createDoc(data) { return this.request('/google/docs', { method: 'POST', body: data }); }

  // Reports
  generateReport(data) { return this.request('/reports/operations', { method: 'POST', body: data }); }
}

export const api = new ApiClient();
export default api;
