import { create } from 'zustand';
import api from '../api/axios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  getNotifications: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/notifications');
      const notifications = response.data.data || [];
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ notifications, unreadCount, loading: false });
    } catch (err) {
      console.error('Failed to get notifications:', err.message);
      set({ loading: false });
    }
  },

  markRead: async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      const updated = get().notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      const unreadCount = updated.filter(n => !n.isRead).length;
      set({ notifications: updated, unreadCount });
    } catch (err) {
      console.error('Failed to mark notification read:', err.message);
    }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      
      const updated = get().notifications.map(n => ({ ...n, isRead: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (err) {
      console.error('Failed to mark all notifications read:', err.message);
    }
  },

  addNotification: (notification) => {
    const current = get().notifications;
    // Prevent duplicates
    if (!current.some(n => n.id === notification.id)) {
      const updated = [notification, ...current];
      const unreadCount = updated.filter(n => !n.isRead).length;
      set({ notifications: updated, unreadCount });
    }
  },
}));
