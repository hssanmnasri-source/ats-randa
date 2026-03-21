import api from './api';
import type { UserOut, UserListOut, UserCreateIn, AdminStats } from '../types/api';

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const res = await api.get<AdminStats>('/api/admin/stats');
    return res.data;
  },

  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<UserListOut> {
    const res = await api.get<UserListOut>('/api/admin/users', { params });
    return res.data;
  },

  async createUser(data: UserCreateIn): Promise<UserOut> {
    const res = await api.post<UserOut>('/api/admin/users', data);
    return res.data;
  },

  async toggleUser(id: number): Promise<UserOut> {
    const res = await api.patch<UserOut>(`/api/admin/users/${id}/toggle`);
    return res.data;
  },

  async updateUser(id: number, data: Partial<UserCreateIn>): Promise<UserOut> {
    const res = await api.put<UserOut>(`/api/admin/users/${id}`, data);
    return res.data;
  },
};
