import { useAuthStore } from '../store/useAuthStore';

/**
 * Custom React hook wrapping the Zustand useAuthStore state.
 * Exposes authentication state, action functions, and helpful boolean flags.
 */
export const useAuth = () => {
  const { user, accessToken, loading, error, login, signup, logout, checkAuth } = useAuthStore();

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    isMentor: user?.role === 'MENTOR',
    isStudent: user?.role === 'STUDENT',
    loading,
    error,
    login,
    signup,
    logout,
    checkAuth,
  };
};
