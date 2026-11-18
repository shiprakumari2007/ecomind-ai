/**
 * EcoMind AI API Client
 * Connects React frontend with FastAPI backend REST endpoints.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};

  // If payload is not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Fallback to text
      const errText = await response.text();
      if (errText) errorDetail = errText;
    }
    throw new Error(errorDetail);
  }

  // Handle binary/file responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    return await response.blob();
  }

  return await response.json();
}

export const api = {
  // Analytics
  getOverview: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics/overview${query ? `?${query}` : ''}`);
  },

  // Datasets
  uploadDataset: (formData, replaceExisting = true) => {
    return request(`/datasets/upload?replace_existing=${replaceExisting}`, {
      method: 'POST',
      body: formData,
    });
  },
  loadSampleDataset: () => {
    return request('/datasets/load-sample', { method: 'POST' });
  },
  getDatasetPreview: (limit = 15) => {
    return request(`/datasets/preview?limit=${limit}`);
  },

  // Anomalies
  getAnomalies: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/anomalies/detect${query ? `?${query}` : ''}`);
  },
  runAnomalyDetection: (contamination = 0.03) => {
    return request(`/anomalies/run?contamination=${contamination}`, { method: 'POST' });
  },
  updateAnomalyStatus: (id, status) => {
    return request(`/anomalies/${id}/status?status=${status}`, { method: 'PATCH' });
  },

  // Forecasting
  getForecast: (horizon = 7, modelType = 'GradientBoosting') => {
    return request(`/forecasting/predict?horizon=${horizon}&model_type=${modelType}`);
  },

  // Recommendations
  getRecommendations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/recommendations${query ? `?${query}` : ''}`);
  },
  updateRecommendationStatus: (id, status) => {
    return request(`/recommendations/${id}/status?status=${status}`, { method: 'PATCH' });
  },

  // Carbon Footprint
  getCarbonSummary: (factorOverride = null) => {
    const query = factorOverride ? `?emission_factor_override=${factorOverride}` : '';
    return request(`/carbon/summary${query}`);
  },

  // Simulator
  runSimulation: (params) => {
    return request('/simulator/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Chatbot
  sendChatMessage: (message, sessionId = 'default') => {
    return request('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    });
  },
  getChatHistory: (sessionId = 'default') => {
    return request(`/chatbot/history?session_id=${sessionId}`);
  },
  clearChatHistory: (sessionId = 'default') => {
    return request(`/chatbot/history?session_id=${sessionId}`, { method: 'DELETE' });
  },

  // Reports
  generateReport: () => {
    return request('/reports/generate', { method: 'POST' });
  },
  listReports: () => {
    return request('/reports/list');
  },

  // Settings
  getSettings: () => {
    return request('/settings');
  },
  updateSettings: (payload) => {
    return request('/settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  resetDatabase: () => {
    return request('/settings/reset', { method: 'POST' });
  },
};
