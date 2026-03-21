import { toast } from 'sonner';
import type { CreateTicketDto, UpdateTicketDto } from '@/types';

const API_URL = '/api';

declare const __DEMO_MODE__: boolean;
const IS_DEMO_MODE = typeof __DEMO_MODE__ !== 'undefined' ? __DEMO_MODE__ : false;

// ─── Storage helpers ──────────────────────────────────────────────────────────
const storage = {
  get:    (k: string) => sessionStorage.getItem(k),
  set:    (k: string, v: string) => sessionStorage.setItem(k, v),
  remove: (k: string) => sessionStorage.removeItem(k),
};

// ─── API Service ──────────────────────────────────────────────────────────────
class ApiService {
  private token: string | null;

  constructor() {
    this.token = storage.get('token');
  }

  setToken(t: string)  { this.token = t; storage.set('token', t); }
  clearToken()         { this.token = null; storage.remove('token'); storage.remove('sessionToken'); storage.remove('user'); }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (IS_DEMO_MODE) return this.getDemoData(endpoint, options);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      const ct = response.headers.get('content-type');
      if (!ct?.includes('application/json'))
        throw new Error('Backend server is not running. Please run the server locally.');
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      return response.json();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('Backend server is not running')) throw error;
      throw new Error('Cannot connect to server. Please make sure the backend is running.', { cause: error });
    }
  }

  // Minimal demo data stubs (only used when VITE_DEMO_MODE=true)
  private getDemoData(endpoint: string, options: RequestInit): Promise<unknown> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const method = options.method || 'GET';
        if (endpoint === '/auth/me')                              { resolve({ user: JSON.parse(storage.get('user') || '{}') }); return; }
        if (endpoint === '/departments')                          { resolve([]); return; }
        if (endpoint === '/tickets' && method === 'GET')          { resolve([]); return; }
        if (endpoint === '/tickets' && method === 'POST')         { resolve({ id: 1, ticket_number: 'TKT-DEMO', title: 'Demo', status: 'open', priority: 'medium', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); return; }
        if (endpoint === '/admin/dashboard-stats')                { resolve({ stats: { totalInterns: 0, pendingApprovals: 0, approvedInterns: 0, todayLogins: 0, tasksToday: 0 }, recentActivities: [] }); return; }
        if (endpoint === '/admin/interns')                        { resolve({ interns: [] }); return; }
        if (endpoint === '/admin/admins' && method === 'POST')    { resolve({ message: 'Admin created', adminId: Date.now() }); return; }
        if (endpoint === '/admin/admins')                         { resolve({ admins: [] }); return; }
        if (endpoint === '/intern/profile')                       { resolve({ profile: JSON.parse(storage.get('user') || '{}') }); return; }
        if (endpoint === '/intern/tasks')                         { resolve({ tasks: [] }); return; }
        if (endpoint === '/intern/login-history')                 { resolve({ history: [] }); return; }
        if (endpoint === '/intern/files')                         { resolve({ files: [] }); return; }
        if (endpoint.startsWith('/intern/tasks') && method === 'POST')    { resolve({ message: 'Task created', taskId: Date.now() }); return; }
        if (endpoint.startsWith('/intern/tasks/') && method === 'PUT')    { resolve({ message: 'Task updated' }); return; }
        if (endpoint.startsWith('/intern/tasks/') && method === 'DELETE') { resolve({ message: 'Task deleted' }); return; }
        if (endpoint.startsWith('/admin/interns/') && endpoint.includes('/approve')) { resolve({ message: 'Approved' }); return; }
        if (endpoint.startsWith('/admin/interns/') && endpoint.includes('/reject'))  { resolve({ message: 'Rejected' }); return; }
        if (endpoint.startsWith('/admin/interns/'))               { resolve({ intern: {}, loginLogs: [], tasks: [], files: [] }); return; }
        if (endpoint.startsWith('/tickets/') && method === 'PATCH'){ resolve({}); return; }
        if (endpoint.startsWith('/tickets/'))                     { resolve({}); return; }
        if (endpoint.startsWith('/departments/'))                 { resolve({}); return; }
        if (endpoint.startsWith('/files/') && method === 'DELETE'){ resolve({ message: 'Deleted' }); return; }
        reject(new Error('Demo endpoint not implemented: ' + endpoint));
      }, 300);
    });
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  async login(email: string, password: string, gpsData?: Record<string, unknown>, deviceInfo?: Record<string, unknown>) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, ...gpsData, deviceInfo }) });
  }
  async register(data: Record<string, unknown>)            { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }); }
  async logout(sessionToken: string, gpsData?: Record<string, unknown>) {
    return this.request('/auth/logout', { method: 'POST', body: JSON.stringify({ sessionToken, ...gpsData }) });
  }
  async getMe()                                            { return this.request('/auth/me'); }
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
  }

  // ── Admin ────────────────────────────────────────────────────────────────────
  async getInterns(params?: { status?: string; department?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.status)     q.append('status', params.status);
    if (params?.department) q.append('department', params.department);
    if (params?.search)     q.append('search', params.search);
    return this.request(`/admin/interns?${q}`);
  }
  async getInternDetails(id: number)                       { return this.request(`/admin/interns/${id}`); }
  async approveIntern(id: number)                          { return this.request(`/admin/interns/${id}/approve`, { method: 'POST' }); }
  async rejectIntern(id: number)                           { return this.request(`/admin/interns/${id}/reject`,  { method: 'POST' }); }
  async updateIntern(id: number, data: Record<string, unknown>) { return this.request(`/admin/interns/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async createAdmin(data: Record<string, unknown>)         { return this.request('/admin/admins',  { method: 'POST', body: JSON.stringify(data) }); }
  async getAdmins()                                        { return this.request('/admin/admins'); }
  async getDashboardStats()                                { return this.request('/admin/dashboard-stats'); }

  // ── Intern ───────────────────────────────────────────────────────────────────
  async getProfile()                                       { return this.request('/intern/profile'); }
  async updateProfile(data: Record<string, unknown>)       { return this.request('/intern/profile', { method: 'PUT', body: JSON.stringify(data) }); }
  async getLoginHistory()                                  { return this.request('/intern/login-history'); }
  async getTasks(params?: { date?: string; startDate?: string; endDate?: string }) {
    const q = new URLSearchParams();
    if (params?.date)       q.append('date', params.date);
    if (params?.startDate)  q.append('startDate', params.startDate);
    if (params?.endDate)    q.append('endDate', params.endDate);
    return this.request(`/intern/tasks?${q}`);
  }
  async createTask(data: Record<string, unknown>)          { return this.request('/intern/tasks',     { method: 'POST',   body: JSON.stringify(data) }); }
  async updateTask(id: number, data: Record<string, unknown>) { return this.request(`/intern/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteTask(id: number)                             { return this.request(`/intern/tasks/${id}`, { method: 'DELETE' }); }
  async getFiles()                                         { return this.request('/intern/files'); }

  // ── Files ────────────────────────────────────────────────────────────────────
  async uploadFile(file: File, category?: string, description?: string) {
    if (IS_DEMO_MODE) return Promise.resolve({ message: 'Demo upload', file: { id: Date.now() } });
    const formData = new FormData();
    formData.append('file', file);
    if (category)    formData.append('category', category);
    if (description) formData.append('description', description);
    const resp = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData,
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({ error: 'Upload failed' })); throw new Error(e.error); }
    return resp.json();
  }
  async downloadFile(id: number) {
    if (IS_DEMO_MODE) { toast.info('Download not available in demo mode'); return; }
    const resp = await fetch(`${API_URL}/files/download/${id}`, { headers: { 'Authorization': `Bearer ${this.token}` } });
    if (!resp.ok) throw new Error('Download failed');
    const blob = await resp.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = resp.headers.get('content-disposition')?.split('filename=')[1] || 'download';
    document.body.appendChild(a); a.click();
    window.URL.revokeObjectURL(url); document.body.removeChild(a);
  }
  async deleteFile(id: number) { return this.request(`/files/${id}`, { method: 'DELETE' }); }

  // ── Departments ──────────────────────────────────────────────────────────────
  async getDepartments()                                   { return this.request('/departments'); }
  async getDepartment(id: number)                          { return this.request(`/departments/${id}`); }
  async createDepartment(data: Record<string, unknown>)    { return this.request('/departments', { method: 'POST',  body: JSON.stringify(data) }); }
  async updateDepartment(id: number, data: Record<string, unknown>) { return this.request(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }

  // ── Tickets ──────────────────────────────────────────────────────────────────
  async getTickets(params?: { status?: string; priority?: string; department_id?: number }) {
    const q = new URLSearchParams();
    if (params?.status)        q.append('status', params.status);
    if (params?.priority)      q.append('priority', params.priority);
    if (params?.department_id) q.append('department_id', String(params.department_id));
    return this.request(`/tickets?${q}`);
  }
  async getTicket(id: number)                              { return this.request(`/tickets/${id}`); }
  async createTicket(data: CreateTicketDto)                { return this.request('/tickets', { method: 'POST',  body: JSON.stringify(data) }); }
  async updateTicket(id: number, data: UpdateTicketDto)    { return this.request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async deleteTicket(id: number)                           { return this.request(`/tickets/${id}`, { method: 'DELETE' }); }
}

export const api = new ApiService();
