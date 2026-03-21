import { toast } from 'sonner';

const API_URL = '/api';

// ─── FIX #10: Demo mode is a BUILD-TIME flag, not a runtime localStorage toggle ───
// Set VITE_DEMO_MODE=true in your .env.development file to enable it.
// It is always false in production builds, so no user can flip it via DevTools.
declare const __DEMO_MODE__: boolean;
const IS_DEMO_MODE = typeof __DEMO_MODE__ !== 'undefined' ? __DEMO_MODE__ : false;

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_INTERN_PROFILE = {
  profile: {
    id: 1, user_id: 2, intern_code: 'INT-2024-12345',
    first_name: 'John', last_name: 'Doe',
    sa_id: '0001010001082', date_of_birth: '2000-01-01',
    gender: 'Male', citizenship: 'South African Citizen',
    phone: '+27 12 345 6789', address: '123 Main Street',
    city: 'Johannesburg', province: 'Gauteng', postal_code: '2000',
    emergency_contact_name: 'Jane Doe', emergency_contact_phone: '+27 12 345 6790',
    department: 'IT', position: 'Software Developer Intern',
    approval_status: 'approved', email: 'intern@example.com',
    user_created_at: '2024-01-01T00:00:00.000Z',
  },
};

const DEMO_TASKS = {
  tasks: [
    { id: 1, intern_id: 1, task_date: '2024-03-07', title: 'Completed API integration', description: 'Integrated the user authentication API', status: 'completed', hours_spent: 4, created_at: '2024-03-07T10:00:00.000Z', updated_at: '2024-03-07T10:00:00.000Z' },
    { id: 2, intern_id: 1, task_date: '2024-03-07', title: 'Fixed UI bugs', description: 'Resolved responsive design issues', status: 'completed', hours_spent: 3, created_at: '2024-03-07T14:00:00.000Z', updated_at: '2024-03-07T14:00:00.000Z' },
    { id: 3, intern_id: 1, task_date: '2024-03-06', title: 'Database schema design', description: 'Designed the user table schema', status: 'completed', hours_spent: 5, created_at: '2024-03-06T09:00:00.000Z', updated_at: '2024-03-06T09:00:00.000Z' },
  ],
};

const DEMO_LOGIN_HISTORY = {
  history: [
    { id: 1, user_id: 2, login_time: '2024-03-07T08:00:00.000Z', logout_time: '2024-03-07T17:00:00.000Z', ip_address: '192.168.1.1', device_info: 'Chrome on Windows', browser: 'Chrome', os: 'Windows', login_latitude: -26.2041, login_longitude: 28.0473, login_accuracy: 10 },
    { id: 2, user_id: 2, login_time: '2024-03-06T08:30:00.000Z', logout_time: '2024-03-06T16:30:00.000Z', ip_address: '192.168.1.1', device_info: 'Chrome on Windows', browser: 'Chrome', os: 'Windows', login_latitude: -26.2041, login_longitude: 28.0473, login_accuracy: 15 },
  ],
};

const DEMO_FILES = {
  files: [
    { id: 1, intern_id: 1, file_name: 'resume.pdf', original_name: 'My_Resume.pdf', file_type: 'application/pdf', file_size: 102400, category: 'document', description: 'My updated resume', uploaded_at: '2024-03-01T10:00:00.000Z' },
    { id: 2, intern_id: 1, file_name: 'certificate.jpg', original_name: 'Degree_Certificate.jpg', file_type: 'image/jpeg', file_size: 204800, category: 'certificate', description: 'University degree', uploaded_at: '2024-03-02T11:00:00.000Z' },
  ],
};

const DEMO_DASHBOARD_STATS = {
  stats: { totalInterns: 15, pendingApprovals: 3, approvedInterns: 12, todayLogins: 8, tasksToday: 24 },
  recentActivities: [
    { id: 1, user_id: 2, action: 'LOGIN', details: '{}', ip_address: '192.168.1.1', created_at: '2024-03-07T08:00:00.000Z', email: 'intern@example.com', first_name: 'John', last_name: 'Doe' },
    { id: 2, user_id: 3, action: 'TASK_CREATED', details: '{"taskId": 1}', ip_address: '192.168.1.2', created_at: '2024-03-07T09:00:00.000Z', email: 'intern2@example.com', first_name: 'Jane', last_name: 'Smith' },
  ],
};

const DEMO_INTERNS = {
  interns: [
    { id: 1, user_id: 2, intern_code: 'INT-2024-12345', first_name: 'John', last_name: 'Doe', sa_id: '0001010001082', date_of_birth: '2000-01-01', gender: 'Male', citizenship: 'South African Citizen', phone: '+27 12 345 6789', address: '123 Main Street', city: 'Johannesburg', province: 'Gauteng', postal_code: '2000', emergency_contact_name: 'Jane Doe', emergency_contact_phone: '+27 12 345 6790', department: 'IT', position: 'Software Developer Intern', approval_status: 'approved', email: 'intern@example.com', user_created_at: '2024-01-01T00:00:00.000Z' },
    { id: 2, user_id: 3, intern_code: 'INT-2024-12346', first_name: 'Jane', last_name: 'Smith', sa_id: '0001020001083', date_of_birth: '2000-01-02', gender: 'Female', citizenship: 'South African Citizen', phone: '+27 12 345 6791', address: '456 Oak Street', city: 'Cape Town', province: 'Western Cape', postal_code: '8000', emergency_contact_name: 'John Smith', emergency_contact_phone: '+27 12 345 6792', department: 'Marketing', position: 'Marketing Intern', approval_status: 'approved', email: 'intern2@example.com', user_created_at: '2024-01-02T00:00:00.000Z' },
    { id: 3, user_id: 4, intern_code: 'INT-2024-12347', first_name: 'Bob', last_name: 'Johnson', sa_id: '0001030001084', date_of_birth: '2000-01-03', gender: 'Male', citizenship: 'South African Citizen', phone: '+27 12 345 6793', address: '789 Pine Street', city: 'Durban', province: 'KwaZulu-Natal', postal_code: '4000', emergency_contact_name: 'Alice Johnson', emergency_contact_phone: '+27 12 345 6794', department: 'HR', position: 'HR Intern', approval_status: 'pending', email: 'intern3@example.com', user_created_at: '2024-01-03T00:00:00.000Z' },
  ],
};

const DEMO_ADMINS = {
  admins: [
    { id: 1, email: 'superadmin@internsystem.com', role: 'super_admin', status: 'active', created_at: '2024-01-01T00:00:00.000Z' },
    { id: 2, email: 'admin@example.com', role: 'admin', status: 'active', created_at: '2024-01-02T00:00:00.000Z' },
  ],
};

// ─── API Service ───────────────────────────────────────────────────────────────

class ApiService {
  // ─── FIX #9: Token stored in sessionStorage, not localStorage ───
  // sessionStorage is cleared when the tab closes, limiting the exposure window
  // for XSS attacks. The ideal solution is HttpOnly cookies set by the server,
  // but that requires a backend change to auth flow; sessionStorage is the
  // safe client-side interim step.
  private token: string | null;

  constructor() {
    this.token = sessionStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    sessionStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sessionToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (IS_DEMO_MODE) {
      return this.getDemoData(endpoint, options);
    }

    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const response = await fetch(url, { ...options, headers });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Backend server is not running. Please run the server locally.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Backend server is not running')) throw error;
      // ─── FIX #15: preserve the original error as cause ───
      throw new Error('Cannot connect to server. Please make sure the backend is running.', {
        cause: error,
      });
    }
  }

  // ─── FIX #11: POST /admin/admins branch must be checked BEFORE GET ───
  private getDemoData(endpoint: string, options: RequestInit): Promise<unknown> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const method = options.method || 'GET';

        if (endpoint === '/auth/me') {
          const user = JSON.parse(sessionStorage.getItem('user') || '{}');
          resolve({ user }); return;
        }

        // Intern
        if (endpoint === '/intern/profile' && method === 'GET') { resolve(DEMO_INTERN_PROFILE); return; }
        if (endpoint === '/intern/profile' && method === 'PUT') { resolve({ message: 'Profile updated' }); return; }
        if (endpoint.startsWith('/intern/tasks') && method === 'POST') { resolve({ message: 'Task created', taskId: Date.now() }); return; }
        if (endpoint.startsWith('/intern/tasks/') && method === 'PUT') { resolve({ message: 'Task updated' }); return; }
        if (endpoint.startsWith('/intern/tasks/') && method === 'DELETE') { resolve({ message: 'Task deleted' }); return; }
        if (endpoint === '/intern/tasks') { resolve(DEMO_TASKS); return; }
        if (endpoint === '/intern/login-history') { resolve(DEMO_LOGIN_HISTORY); return; }
        if (endpoint === '/intern/files') { resolve(DEMO_FILES); return; }

        // Admin — FIX #11: POST check before GET for /admin/admins
        if (endpoint === '/admin/admins' && method === 'POST') { resolve({ message: 'Admin created', adminId: Date.now() }); return; }
        if (endpoint === '/admin/admins') { resolve(DEMO_ADMINS); return; }
        if (endpoint === '/admin/dashboard-stats') { resolve(DEMO_DASHBOARD_STATS); return; }
        if (endpoint.startsWith('/admin/interns/') && endpoint.includes('/approve')) { resolve({ message: 'Intern approved' }); return; }
        if (endpoint.startsWith('/admin/interns/') && endpoint.includes('/reject')) { resolve({ message: 'Intern rejected' }); return; }
        if (endpoint.startsWith('/admin/interns/') && method === 'PUT') { resolve({ message: 'Intern updated' }); return; }
        if (endpoint.startsWith('/admin/interns/') && method === 'GET') {
          const internId = parseInt(endpoint.split('/')[2]);
          const intern = DEMO_INTERNS.interns.find(i => i.id === internId);
          if (intern) resolve({ intern, loginLogs: DEMO_LOGIN_HISTORY.history, tasks: DEMO_TASKS.tasks, files: DEMO_FILES.files });
          else reject(new Error('Intern not found'));
          return;
        }
        if (endpoint === '/admin/interns') { resolve(DEMO_INTERNS); return; }

        // Files
        if (endpoint === '/files/upload') { resolve({ message: 'File uploaded', file: { id: Date.now(), fileName: 'uploaded.pdf', originalName: 'document.pdf' } }); return; }
        if (endpoint.startsWith('/files/') && method === 'DELETE') { resolve({ message: 'File deleted' }); return; }

        reject(new Error('Demo endpoint not implemented'));
      }, 300);
    });
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string, gpsData?: Record<string, unknown>, deviceInfo?: Record<string, unknown>) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, ...gpsData, deviceInfo }) });
  }

  async register(data: Record<string, unknown>) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async logout(sessionToken: string, gpsData?: Record<string, unknown>) {
    return this.request('/auth/logout', { method: 'POST', body: JSON.stringify({ sessionToken, ...gpsData }) });
  }

  async getMe() { return this.request('/auth/me'); }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getInterns(params?: { status?: string; department?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.department) q.append('department', params.department);
    if (params?.search) q.append('search', params.search);
    return this.request(`/admin/interns?${q}`);
  }

  async getInternDetails(id: number) { return this.request(`/admin/interns/${id}`); }
  async approveIntern(id: number) { return this.request(`/admin/interns/${id}/approve`, { method: 'POST' }); }
  async rejectIntern(id: number) { return this.request(`/admin/interns/${id}/reject`, { method: 'POST' }); }
  async updateIntern(id: number, data: Record<string, unknown>) { return this.request(`/admin/interns/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async createAdmin(data: Record<string, unknown>) { return this.request('/admin/admins', { method: 'POST', body: JSON.stringify(data) }); }
  async getAdmins() { return this.request('/admin/admins'); }
  async getDashboardStats() { return this.request('/admin/dashboard-stats'); }

  // ─── Intern ────────────────────────────────────────────────────────────────

  async getProfile() { return this.request('/intern/profile'); }
  async updateProfile(data: Record<string, unknown>) { return this.request('/intern/profile', { method: 'PUT', body: JSON.stringify(data) }); }
  async getLoginHistory() { return this.request('/intern/login-history'); }

  async getTasks(params?: { date?: string; startDate?: string; endDate?: string }) {
    const q = new URLSearchParams();
    if (params?.date) q.append('date', params.date);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    return this.request(`/intern/tasks?${q}`);
  }

  async createTask(data: Record<string, unknown>) { return this.request('/intern/tasks', { method: 'POST', body: JSON.stringify(data) }); }
  async updateTask(id: number, data: Record<string, unknown>) { return this.request(`/intern/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteTask(id: number) { return this.request(`/intern/tasks/${id}`, { method: 'DELETE' }); }
  async getFiles() { return this.request('/intern/files'); }

  // ─── Files ─────────────────────────────────────────────────────────────────

  async uploadFile(file: File, category?: string, description?: string) {
    if (IS_DEMO_MODE) {
      return new Promise(resolve => setTimeout(() =>
        resolve({ message: 'File uploaded (demo mode)', file: { id: Date.now(), fileName: file.name, originalName: file.name, fileType: file.type, fileSize: file.size } })
      , 300));
    }

    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    if (description) formData.append('description', description);

    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async downloadFile(id: number) {
    if (IS_DEMO_MODE) {
      // ─── FIX #14: use toast instead of alert() ───
      toast.info('Download not available in demo mode');
      return;
    }

    const response = await fetch(`${API_URL}/files/download/${id}`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async deleteFile(id: number) { return this.request(`/files/${id}`, { method: 'DELETE' }); }
}

export const api = new ApiService();
