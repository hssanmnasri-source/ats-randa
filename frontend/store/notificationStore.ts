import { create } from 'zustand'

interface Notification { id: string; type: 'success' | 'error' | 'info'; message: string }
interface NotifStore {
  notifications: Notification[]
  add: (type: Notification['type'], message: string) => void
  remove: (id: string) => void
}

export const useNotifStore = create<NotifStore>((set) => ({
  notifications: [],
  add: (type, message) => {
    const id = Date.now().toString()
    set(s => ({ notifications: [...s.notifications, { id, type, message }] }))
    setTimeout(() => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })), 4000)
  },
  remove: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}))