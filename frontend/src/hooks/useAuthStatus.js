import { useState } from "react";

/**
 * useAuthStatus hook
 *
 * Mock authentication status hook for landing page testing.
 * Returns authentication state and toggle function.
 *
 * Usage:
 *   const { isAuthenticated, toggleAuth } = useAuthStatus();
 *
 * In production, this would be replaced with actual auth context/API.
 */
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const toggleAuth = () => {
    setIsAuthenticated(!isAuthenticated);
  };

  return {
    isAuthenticated,
    toggleAuth,
    user: isAuthenticated
      ? {
          id: "user-123",
          name: "Demo User",
          email: "demo@nexus.ai",
        }
      : null,
  };
};

export default useAuthStatus;
