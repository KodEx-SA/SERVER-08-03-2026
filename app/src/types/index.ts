export interface User {
  id: number;
  email: string;
  role: 'super_admin' | 'admin' | 'intern';
  internId?: number;
  internCode?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface Intern {
  id: number;
  user_id: number;
  intern_code: string;
  first_name: string;
  last_name: string;
  sa_id: string;
  date_of_birth: string;
  gender: string;
  citizenship: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  department?: string;
  position?: string;
  profile_image?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  user_status?: 'active' | 'inactive' | 'pending';
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  email?: string;
}

export interface Task {
  id: number;
  intern_id: number;
  task_date: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  hours_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface LoginLog {
  id: number;
  user_id: number;
  login_time: string;
  logout_time?: string;
  ip_address?: string;
  device_info?: string;
  browser?: string;
  os?: string;
  login_latitude?: number;
  login_longitude?: number;
  login_accuracy?: number;
  logout_latitude?: number;
  logout_longitude?: number;
  logout_accuracy?: number;
}

export interface FileItem {
  id: number;
  intern_id: number;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category?: string;
  description?: string;
  uploaded_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface DashboardStats {
  totalInterns: number;
  pendingApprovals: number;
  approvedInterns: number;
  todayLogins: number;
  tasksToday: number;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}
