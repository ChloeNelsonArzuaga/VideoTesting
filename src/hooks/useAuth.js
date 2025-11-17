import { useState, useEffect } from 'react';

/**
 * useAuth.js
 * 
 * Custom hook for handling Google OAuth authentication
 * - Checks auth status on mount
 * - Creates picker session when authenticated
 * - Handles login/logout
 */

export function useAuth() {
  const [user, setUser] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Not authenticated');

      const data = await response.json();
      console.log('[useAuth] Auth check result:', data);
      if (data.authenticated) {
        setUser(data.user);
        console.log('[useAuth] User authenticated, creating session...');
        await createSession();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.log('[useAuth] User not authenticated:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      console.log('[useAuth] Creating session...');
      const response = await fetch('/api/photos/session', {
        method: 'POST',
        credentials: 'include',
      });

      console.log('[useAuth] Session response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[useAuth] Session error response:', errorData);
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useAuth] Session created:', data);
      setSessionData(data);
      setError(null);
    } catch (err) {
      console.error('[useAuth] Error creating session:', err);
      setError(err.message);
    }
  };

  const login = () => {
    window.location.href = '/auth/google';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        credentials: 'include',
      });
      setUser(null);
      setSessionData(null);
    } catch (err) {
      console.error('[useAuth] Error logging out:', err);
    }
  };

  return {
    user,
    sessionData,
    loading,
    error,
    login,
    logout,
  };
}
