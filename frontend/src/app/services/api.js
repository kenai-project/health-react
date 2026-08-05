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


// SSE Streaming helper
const _streamAnalysis = async (endpoint, body, onEvent, signal) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = getAuthHeaders();

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw { response: { data: error, status: response.status } };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events (delimited by \n\n)
      let eventEnd;
      while ((eventEnd = buffer.indexOf('\n\n')) !== -1) {
        const eventData = buffer.slice(0, eventEnd);
        buffer = buffer.slice(eventEnd + 2);

        // Parse SSE event
        const lines = eventData.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);
              onEvent(event);
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            onEvent(event);
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    onEvent({ type: 'error', message: error.message || 'Stream failed' });
  } finally {
    reader.releaseLock();
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

// LLM API
export const llmService = {
  checkHealth: async () => {
    return fetchAPI('/llm/health');
  },

  chat: async (message, history = [], language = null) => {
    return fetchAPI('/llm/chat', {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ message, history, language })
    });
  },

  analyze: async (limit = 10, language = null) => {
    return fetchAPI('/llm/analyze', {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ limit, language })
    });
  },

  suggestions: async (limit = 10, language = null) => {
    return fetchAPI('/llm/suggestions', {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ limit, language })
    });
  }
};

// Documents API
export const documentService = {
  upload: async (files, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else reject(new Error(xhr.responseText || 'Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.open('POST', `${API_BASE_URL}/api/v1/documents/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
      xhr.send(formData);
    });
  },

  extract: async (documentId) => {
    return fetchAPI('/api/v1/documents/extract', {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ document_id: documentId })
    });
  },

  list: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/api/v1/documents${queryString ? `?${queryString}` : ''}`);
  },

  get: async (id) => {
    return fetchAPI(`/api/v1/documents/${id}`);
  },

  delete: async (id) => {
    return fetchAPI(`/api/v1/documents/${id}`, { method: 'DELETE' });
  },

// Analysis API
  generateSummary: async (documentId, language = null) => {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    return fetchAPI(`/api/v1/documents/${documentId}/summary${qs}`, {
      method: 'POST',
      headers: getJsonHeaders(),
    });
  },

  generateExplanation: async (documentId, language = null) => {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    return fetchAPI(`/api/v1/documents/${documentId}/explanation${qs}`, {
      method: 'POST',
      headers: getJsonHeaders(),
    });
  },

  askQuestion: async (documentId, question, language = null) => {
    return fetchAPI(`/api/v1/documents/${documentId}/question`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ question, language })
    });
  },

  getAnalyses: async (documentId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/api/v1/documents/${documentId}/analyses${queryString ? `?${queryString}` : ''}`);
  },

  deleteAnalysis: async (documentId, analysisId) => {
    return fetchAPI(`/api/v1/documents/${documentId}/analyses/${analysisId}`, {
      method: 'DELETE',
    });
  },

  regenerateAnalysis: async (documentId, analysisId) => {
    return fetchAPI(`/api/v1/documents/${documentId}/analyses/${analysisId}/regenerate`, {
      method: 'POST',
      headers: getJsonHeaders(),
    });
  },

// Streaming Analysis API (SSE)
  generateSummaryStream: (documentId, onEvent, signal, language = null) => {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    return _streamAnalysis(`/api/v1/documents/${documentId}/summary/stream${qs}`, null, onEvent, signal);
  },

  generateExplanationStream: (documentId, onEvent, signal, language = null) => {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    return _streamAnalysis(`/api/v1/documents/${documentId}/explanation/stream${qs}`, null, onEvent, signal);
  },

  askQuestionStream: (documentId, question, onEvent, signal, language = null) => {
    return _streamAnalysis(`/api/v1/documents/${documentId}/question/stream`, { question, language }, onEvent, signal);
  }
};
