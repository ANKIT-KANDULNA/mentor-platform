import { create } from 'zustand';
import { login as apiLogin, signup as apiSignup, logout as apiLogout, getMe as apiGetMe } from '../api/auth.api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  loading: false,
  error: null,

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
    set({ accessToken: token });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiLogin(email, password);
      const { accessToken, user } = data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, accessToken, loading: false });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  signup: async (fullName, email, password, role) => {
    set({ loading: true, error: null });
    try {
      const data = await apiSignup(fullName, email, password, role);
      set({ loading: false });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Signup failed';
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout error on backend:', err.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      set({ user: null, accessToken: null });
    }
  },

  checkAuth: async () => {
    const token = get().accessToken;
    if (!token) return null;
    
    set({ loading: true, error: null });
    try {
      const data = await apiGetMe();
      const user = data.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
      return user;
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      set({ user: null, accessToken: null, loading: false });
      return null;
    }
  },
}));
