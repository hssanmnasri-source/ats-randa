import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

// Decode JWT payload to extract user info
export function decodeToken(token: string): { sub: string; role: Role } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { sub: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'ats-randa-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && state?.user) {
          state.isAuthenticated = true;
        }
      },
    }
  )
);
