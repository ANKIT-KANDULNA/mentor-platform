import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Route protection wrapper component. Redirects unauthorized users to /login.
 */
export default function ProtectedRoute({ children }) {
  const { accessToken, user, checkAuth } = useAuthStore();

  useEffect(() => {
    if (accessToken && !user) {
      checkAuth();
    }
  }, [accessToken, user, checkAuth]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
