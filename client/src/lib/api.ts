import { useAuthStore } from '@/store/authStore';
import { ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<ApiResponse<{ user: any; token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request<ApiResponse<{ user: any; token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<ApiResponse<any>>('/auth/me');
  }

  // Leave requests
  async getLeaveRequests(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<PaginatedResponse<any>>(`/leaves${queryString}`);
  }

  async createLeaveRequest(data: any) {
    return this.request<ApiResponse<any>>('/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLeaveRequest(id: string, data: any) {
    return this.request<ApiResponse<any>>(`/leaves/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLeaveRequest(id: string) {
    return this.request<ApiResponse<any>>(`/leaves/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getUsers(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<PaginatedResponse<any>>(`/admin/users${queryString}`);
  }

  async updateUser(id: string, data: any) {
    return this.request<ApiResponse<any>>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getDashboardStats() {
    return this.request<ApiResponse<any>>('/admin/dashboard');
  }

  async getHolidays() {
    return this.request<ApiResponse<any[]>>('/holidays');
  }

  async createHoliday(data: any) {
    return this.request<ApiResponse<any>>('/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);