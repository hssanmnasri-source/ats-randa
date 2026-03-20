import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { id: number; email: string; nom?: string; prenom?: string; role: string }
interface AuthStore {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (token, user) => { localStorage.setItem('token', token); set({ token, user }) },
      logout: () => { localStorage.removeItem('token'); set({ token: null, user: null }) },
    }),
    { name: 'ats-auth' }
  )
)