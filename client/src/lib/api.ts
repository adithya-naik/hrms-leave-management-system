import { useAuthStore } from '@/store/authStore';
import { ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    return this.request<ApiResponse<{ user: any; token: string; refreshToken: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request<ApiResponse<{ user: any; token: string; refreshToken: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<ApiResponse<any>>('/users/me');
  }

  async refreshToken(refreshToken: string) {
    return this.request<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
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

  // User Management endpoints
  async getUsers(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<PaginatedResponse<any>>(`/users${queryString}`);
  }

  async getUserById(id: string) {
    return this.request<ApiResponse<any>>(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.request<ApiResponse<any>>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request<ApiResponse<any>>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserPassword(id: string, data: any) {
    return this.request<ApiResponse<any>>(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deactivateUser(id: string) {
    return this.request<ApiResponse<any>>(`/users/${id}/deactivate`, {
      method: 'PUT',
    });
  }

  async activateUser(id: string) {
    return this.request<ApiResponse<any>>(`/users/${id}/activate`, {
      method: 'PUT',
    });
  }

  async deleteUser(id: string) {
    return this.request<ApiResponse<any>>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getManagers() {
    return this.request<ApiResponse<any[]>>('/users/managers');
  }

  // Dashboard and Admin endpoints
  async getDashboardStats() {
    return this.request<ApiResponse<any>>('/users/dashboard-stats');
  }

  // Holiday endpoints
  async getHolidays(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<ApiResponse<any[]>>(`/holidays${queryString}`);
  }

  async createHoliday(data: any) {
    return this.request<ApiResponse<any>>('/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAllUsersWithDetails(params?: any) {
  const queryString = params ? `?${new URLSearchParams(params)}` : '';
  return this.request<PaginatedResponse<any>>(`/users/all-details${queryString}`);
}
}

export const apiClient = new ApiClient(API_BASE_URL);
