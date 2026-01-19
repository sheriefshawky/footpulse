
// Using /api prefix which is proxied by Vite in dev 
// and can be handled by Nginx/Vercel in production
const API_BASE_URL = 'https://footpulsebe-production.up.railway.app';

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        window.location.reload();
      }
      
      if (!response.ok) {
        let errorDetail = `Error ${response.status}: ${response.statusText}`;
        try {
          const error = await response.json();
          errorDetail = error.detail || errorDetail;
        } catch (e) {
          // Response was not JSON
        }
        throw new Error(errorDetail);
      }
      
      return response.json();
    } catch (err: any) {
      console.error(`API Error at ${endpoint}:`, err);
      // Re-throw to be caught by the UI
      throw err;
    }
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patch(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  
  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
