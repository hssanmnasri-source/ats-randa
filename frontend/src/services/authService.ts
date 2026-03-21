import api from './api';
import type { LoginRequest, RegisterRequest, TokenOut, User } from '../types/auth';
import { decodeToken } from '../store/authStore';

export const authService = {
  async login(data: LoginRequest): Promise<{ token: TokenOut; user: User }> {
    const res = await api.post<TokenOut>('/api/visitor/login', data);
    const tokenData = res.data;

    // Decode JWT to get user id, build minimal user object
    const decoded = decodeToken(tokenData.access_token);
    const user: User = {
      id: decoded ? parseInt(decoded.sub) : 0,
      nom: '',
      prenom: '',
      email: data.email,
      role: tokenData.role,
      is_active: true,
    };

    return { token: tokenData, user };
  },

  async register(data: RegisterRequest): Promise<User> {
    const res = await api.post<User>('/api/visitor/register', data);
    return res.data;
  },
};
