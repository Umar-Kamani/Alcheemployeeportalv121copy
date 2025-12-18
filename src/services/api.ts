// API Service Layer for PostgreSQL Backend Integration

const API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:3001/api';

// Token management
export const TokenManager = {
  getToken: () => localStorage.getItem('auth_token'),
  setToken: (token: string) => localStorage.setItem('auth_token', token),
  removeToken: () => localStorage.removeItem('auth_token'),
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = TokenManager.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Authentication API
export const AuthAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    TokenManager.setToken(response.token);
    return response;
  },

  logout: () => {
    TokenManager.removeToken();
  },
};

// Users API
export const UsersAPI = {
  getAll: () => apiRequest<any[]>('/users'),

  create: (userData: { username: string; password: string; role: string }) =>
    apiRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  resetPassword: (userId: number, newPassword: string) =>
    apiRequest<any>(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  delete: (userId: number) =>
    apiRequest<any>(`/users/${userId}`, {
      method: 'DELETE',
    }),
};

// Employees API
export const EmployeesAPI = {
  getAll: () => apiRequest<any[]>('/employees'),

  create: (employeeData: {
    name: string;
    employee_id: string;
    department: string;
    position: string;
    vehicle_plate_number?: string;
  }) =>
    apiRequest<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    }),

  update: (
    id: number,
    employeeData: {
      name: string;
      employee_id: string;
      department: string;
      position: string;
      vehicle_plate_number?: string;
    }
  ) =>
    apiRequest<any>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    }),

  delete: (id: number) =>
    apiRequest<any>(`/employees/${id}`, {
      method: 'DELETE',
    }),
};

// Attendance API
export const AttendanceAPI = {
  getAll: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/attendance${query}`);
  },

  markEntry: (attendanceData: {
    employee_id?: number;
    employee_name: string;
    date: string;
    time_in: string;
    plate_number?: string;
    is_guest?: boolean;
    guest_purpose?: string;
  }) =>
    apiRequest<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    }),

  markExit: (id: number, timeOut: string) =>
    apiRequest<any>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ time_out: timeOut }),
    }),

  delete: (id: number) =>
    apiRequest<any>(`/attendance/${id}`, {
      method: 'DELETE',
    }),
};

// Parking API
export const ParkingAPI = {
  getConfig: () => apiRequest<{ total_spaces: number; occupied_spaces: number }>('/parking'),

  updateConfig: (config: { total_spaces: number; occupied_spaces: number }) =>
    apiRequest<any>('/parking', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
};