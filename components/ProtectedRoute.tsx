import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, clerkUser } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If no Clerk user at all, redirect to login
  if (!clerkUser) {
    return <Navigate to="/login" replace />;
  }

  // If Clerk user exists but profile hasn't loaded yet, allow access
  // This allows new users to complete profile setup even if profile creation is delayed
  if (clerkUser && !isAuthenticated) {
    // Allow access - profile will be created/loaded in background
    return <>{children}</>;
  }

  // If authenticated, allow access
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback - should not reach here, but just in case
  return <>{children}</>;
};

