import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    const isTokenExpired = (accessToken) => {
      try {
        const parts = accessToken.split('.');
        if (parts.length !== 3) return false;
        // JWT payload is base64url encoded
        const payload = JSON.parse(
          decodeURIComponent(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        );
        if (!payload?.exp) return false;
        const nowSec = Math.floor(Date.now() / 1000);
        return payload.exp <= nowSec;
      } catch {
        return false;
      }
    };

    if (token) {
      if (isTokenExpired(token)) {
        console.warn('AuthContext: stored access_token is expired; clearing localStorage');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } else if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      }
    }

    setLoading(false);
  }, []);


  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      const { access_token } = response;

      localStorage.setItem('access_token', access_token);

      // Backend login returns only tokens; fetch user profile after login.
      // If profile fetch fails (but login succeeded), still allow navigation
      // by treating the presence of a token as authenticated.
      try {
        const userData = await authService.getCurrentUser();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch (profileError) {
        console.warn('AuthContext.login: /auth/me failed, continuing with token-only auth:', profileError);
        setUser({});
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please try again.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
