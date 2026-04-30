import { projectId, publicAnonKey } from './supabase-info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-897e0759`;

class APIClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('access_token');

    if (token) {
      return {
        Authorization: `Bearer ${token}`
      };
    }

    // Fallback to anon key if no user token
    return {
      Authorization: `Bearer ${publicAnonKey}`
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const maxRetries = 3;
    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        const errorMessage = error.error || `HTTP ${response.status}`;

        // Retry on specific status codes
        if (retryableStatuses.includes(response.status) && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
          console.log(`Request failed with ${response.status}, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        // Include status code in error for better handling
        const err = new Error(errorMessage) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }

      return response.json();
    } catch (error: any) {
      // Retry on network errors
      if ((error.message?.includes('fetch') || error.message?.includes('network')) && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 500;
        console.log(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  // Auth
  async signup(email: string, password: string, name?: string) {
    return this.request<{ user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ user: any; session: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.session?.access_token) {
      localStorage.setItem('access_token', response.session.access_token);
    }

    return response;
  }

  async logout() {
    const response = await this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });

    localStorage.removeItem('access_token');
    return response;
  }

  async getSession() {
    return this.request<{ user: any }>('/auth/session');
  }

  // IAPs
  async getIAPs() {
    return this.request<{ iaps: any[] }>('/iaps');
  }

  async getIAP(iapId: string) {
    return this.request<{ iap: any }>(`/iaps/${iapId}`);
  }

  async createIAP(data: any) {
    return this.request<{ iap: any }>('/iaps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIAP(iapId: string, data: any) {
    return this.request<{ iap: any }>(`/iaps/${iapId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIAP(iapId: string) {
    return this.request<{ success: boolean }>(`/iaps/${iapId}`, {
      method: 'DELETE',
    });
  }

  // Operational Periods
  async getPeriods(iapId: string) {
    return this.request<{ periods: any[] }>(`/iaps/${iapId}/periods`);
  }

  async createPeriod(iapId: string, data: any) {
    return this.request<{ period: any }>(`/iaps/${iapId}/periods`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePeriod(iapId: string, periodId: string, data: any) {
    return this.request<{ item: any }>(`/iaps/${iapId}/periods/${periodId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePeriod(iapId: string, periodId: string) {
    return this.request<{ success: boolean }>(`/iaps/${iapId}/periods/${periodId}`, {
      method: 'DELETE',
    });
  }

  // Objectives
  async getObjectives(iapId: string) {
    return this.request<{ objectives: any[] }>(`/iaps/${iapId}/objectives`);
  }

  async createObjective(iapId: string, data: any) {
    return this.request<{ objective: any }>(`/iaps/${iapId}/objectives`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateObjective(iapId: string, objectiveId: string, data: any) {
    return this.request<{ objective: any }>(`/iaps/${iapId}/objectives/${objectiveId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteObjective(iapId: string, objectiveId: string) {
    return this.request<{ success: boolean }>(`/iaps/${iapId}/objectives/${objectiveId}`, {
      method: 'DELETE',
    });
  }

  // Contacts
  async getContacts(iapId: string) {
    return this.request<{ contacts: any[] }>(`/iaps/${iapId}/contacts`);
  }

  async createContact(iapId: string, data: any) {
    return this.request<{ contact: any }>(`/iaps/${iapId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(iapId: string, contactId: string, data: any) {
    return this.request<{ contact: any }>(`/iaps/${iapId}/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(iapId: string, contactId: string) {
    return this.request<{ success: boolean }>(`/iaps/${iapId}/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  // Generic data operations (organization, assignments, communications, medical, safety)
  async getData(iapId: string, dataType: string) {
    return this.request<{ data: any[] }>(`/iaps/${iapId}/${dataType}`);
  }

  async createData(iapId: string, dataType: string, data: any) {
    return this.request<{ item: any }>(`/iaps/${iapId}/${dataType}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateData(iapId: string, dataType: string, itemId: string, data: any) {
    return this.request<{ item: any }>(`/iaps/${iapId}/${dataType}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteData(iapId: string, dataType: string, itemId: string) {
    return this.request<{ success: boolean }>(`/iaps/${iapId}/${dataType}/${itemId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new APIClient();
