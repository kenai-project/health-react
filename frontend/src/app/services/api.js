import { Capacitor } from '@capacitor/core';

// API base URL
// - Android Emulator (Capacitor): http://10.0.2.2:8000
// - Web browser: use localhost PC (default http://127.0.0.1:8000)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://health-react-aoax.onrender.com';



// NOTE:
// We intentionally do not depend on @capacitor/http because the version available in this repo fails to compile on Gradle 9+ (jcenter() removed).
// Fallback: use fetch() everywhere (this keeps the web build working).

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const getJsonHeaders = () => ({
  'Content-Type': 'application/json',
});

const toFormBody = (data) => {
  // @capacitor/http expects strings for body. We'll send JSON strings by default.
  if (data == null) return undefined;
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
};

const buildRequest = (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const method = options.method || 'GET';
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  // Keep current code behavior: callers pass JSON.stringify(...) as `body`.
  // We'll forward that same string to the native HTTP plugin.
  const body = options.body;

  return { url, method, headers, body };
};

// Unified request wrapper
const fetchAPI = async (endpoint, options = {}) => {
  const { url, method, headers, body } = buildRequest(endpoint, options);

  try {
    // Native HTTP plugin not available (compatibility issue), so always use fetch.
    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};


// Auth API
export const authService = {
  login: async (username, password) => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ username, password })
    });
  },


  getCurrentUser: async () => {
    return fetchAPI('/auth/me');
  }
};

// Users API
export const usersService = {
  // Admin user management endpoints
  getAll: async () => {
    return fetchAPI('/admin/users');
  },

  // Not used by current UserManagementPage.jsx (kept for future work)
  getById: async (id) => {
    return fetchAPI(`/admin/users/${id}`);
  },

  create: async (userData) => {
    return fetchAPI('/admin/users', {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(userData)
    });
  },

  // TODO: backend admin update/delete endpoints not present in this repo
  update: async (id, userData) => {
    return fetchAPI(`/admin/users/${id}`, {
      method: 'PUT',
      headers: getJsonHeaders(),
      body: JSON.stringify(userData)
    });
  },

  delete: async (id) => {
    return fetchAPI(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }
};


// Records API
export const recordsService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/records${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => {
    return fetchAPI(`/records/${id}`);
  },

  create: async (recordData) => {
    return fetchAPI('/records', {
      method: 'POST',
      body: JSON.stringify(recordData)
    });
  },

  update: async (id, recordData) => {
    return fetchAPI(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData)
    });
  },

  delete: async (id) => {
    return fetchAPI(`/records/${id}`, {
      method: 'DELETE'
    });
  }
};

// Analytics API
export const analyticsService = {
  getDashboardStats: async () => {
    return fetchAPI('/analytics/dashboard');
  },

  getActivityLog: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/activity${queryString ? `?${queryString}` : ''}`);
  },

  getChartData: async (type) => {
    return fetchAPI(`/analytics/charts/${type}`);
  }
};

// Settings API
export const settingsService = {
  get: async () => {
    return fetchAPI('/settings');
  },

  update: async (settings) => {
    return fetchAPI('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};
