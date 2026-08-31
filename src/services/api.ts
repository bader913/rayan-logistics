// src/services/api.ts

const API_BASE = '/api/v1';

export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rayan_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Request failed with status ${res.status}`;
    const errorCode = data?.error?.code || 'REQUEST_FAILED';
    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('rayan_token');
      localStorage.removeItem('rayan_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new ApiError(errorMsg, errorCode, data?.error?.details);
  }

  return data.data;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Dashboard
  getStats: () => request<any>('/dashboard/stats'),
  getCharts: () => request<any>('/dashboard/charts'),
  getAuditLogs: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request<any[]>(`/dashboard/audit-logs?${query.toString()}`);
  },

  // Assets
  getAssets: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request<any>(`/assets?${query.toString()}`);
  },
  getAssetById: (id: string) => request<any>(`/assets/${id}`),
  getAssetHistory: (id: string) => request<any>(`/assets/${id}/history`),
  createAsset: (data: any) =>
    request<any>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  assignAsset: (id: string, data: any) =>
    request<any>(`/assets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  returnAsset: (id: string, data: any) =>
    request<any>(`/assets/${id}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  transferAsset: (id: string, data: any) =>
    request<any>(`/assets/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Employees
  getEmployees: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request<any[]>(`/employees?${query.toString()}`);
  },
  getEmployeeById: (id: string) => request<any>(`/employees/${id}`),
  createEmployee: (data: any) =>
    request<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Inventory Audits
  getInventorySessions: () => request<any[]>('/inventory/sessions'),
  getInventorySessionById: (id: string) => request<any>(`/inventory/sessions/${id}`),
  createInventorySession: (data: any) =>
    request<any>('/inventory/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  scanInventoryItem: (sessionId: string, data: any) =>
    request<any>(`/inventory/sessions/${sessionId}/scan`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  completeInventorySession: (sessionId: string) =>
    request<any>(`/inventory/sessions/${sessionId}/complete`, {
      method: 'POST',
    }),

  // Maintenance
  getMaintenanceRequests: () => request<any[]>('/maintenance'),
  createMaintenanceRequest: (data: any) =>
    request<any>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMaintenanceRequest: (id: string, data: any) =>
    request<any>(`/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Lookups
  getLocations: () => request<any[]>('/locations/locations'),
  getOffices: () => request<any[]>('/locations/offices'),
  getDepartments: () => request<any[]>('/locations/departments'),
  getCategories: () => request<any[]>('/locations/categories'),
  getDonors: () => request<any[]>('/locations/donors'),
  getCostCenters: () => request<any[]>('/locations/cost-centers'),

  // Import
  previewImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/import/preview', {
      method: 'POST',
      body: formData,
    });
  },
  commitImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/import/commit', {
      method: 'POST',
      body: formData,
    });
  },
  getImportBatches: () => request<any[]>('/import/batches'),
  getImportIssues: (batchId: string) => request<any[]>(`/import/batches/${batchId}/issues`),
};
