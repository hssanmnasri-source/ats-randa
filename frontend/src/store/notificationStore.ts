import { create } from 'zustand';

type NotifType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotifType;
  message: string;
  description?: string;
}

interface NotificationStore {
  notifications: Notification[];
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  success: (message, description) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: Date.now().toString(), type: 'success', message, description },
      ],
    })),

  error: (message, description) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: Date.now().toString(), type: 'error', message, description },
      ],
    })),

  info: (message, description) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: Date.now().toString(), type: 'info', message, description },
      ],
    })),

  warning: (message, description) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: Date.now().toString(), type: 'warning', message, description },
      ],
    })),

  remove: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  clear: () => set({ notifications: [] }),
}));
