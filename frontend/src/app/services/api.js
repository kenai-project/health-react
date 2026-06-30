// API base URL - adjust this to match your FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const getJsonHeaders = () => ({
  'Content-Type': 'application/json',
});


// Generic fetch wrapper
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  try {
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
  getAll: async () => {
    return fetchAPI('/users');
  },

  getById: async (id) => {
    return fetchAPI(`/users/${id}`);
  },

  create: async (userData) => {
    return fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  update: async (id, userData) => {
    return fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  delete: async (id) => {
    return fetchAPI(`/users/${id}`, {
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
