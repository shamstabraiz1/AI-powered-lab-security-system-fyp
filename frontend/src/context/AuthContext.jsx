import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  // Session persistence on initial load / page refresh
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        console.log('[AUTH Context] Restoring session from stored token...');
        try {
          const profile = await authService.getUserProfile();
          setUser(profile);
          localStorage.setItem('user_profile', JSON.stringify(profile));
          console.log('[AUTH Context] Profile restored:', profile.username);
        } catch (err) {
          console.warn('[AUTH Context] Profile load warning. Using cached profile or fallback:', err);
          const savedProfile = localStorage.getItem('user_profile');
          if (savedProfile) {
            setUser(JSON.parse(savedProfile));
          } else {
            setUser({ username: 'admin_user', roles: ['Lab Instructor'] });
          }
        }
      } else {
        console.log('[AUTH Context] No active token found in localStorage.');
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async ({ username, password, role }) => {
    console.log('[AUTH Context] Starting login flow for:', username);

    // 1. Post to JWT token endpoint
    const data = await authService.login({ username, password });

    if (!data.access || !data.refresh) {
      throw new Error('Backend token response missing access or refresh token.');
    }

    // 2. Save tokens to localStorage
    console.log('[AUTH Context] Saving access_token and refresh_token to localStorage.');
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setToken(data.access);

    // 3. Attempt to fetch profile from /api/auth/profile/
    let userProfile = null;
    try {
      console.log('[AUTH Context] Requesting profile from /auth/profile/...');
      userProfile = await authService.getUserProfile();
      console.log('[AUTH Context] Profile fetched:', userProfile);
    } catch (profileErr) {
      console.warn('[AUTH Context] Profile request fallback:', profileErr);
      userProfile = {
        username: username,
        email: `${username}@se.edu.pk`,
        roles: [role || 'Lab Instructor'],
      };
    }

    // 4. Save user profile state
    setUser(userProfile);
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    console.log('[AUTH Context] Login complete.');

    return data;
  };

  const logout = () => {
    console.log('[AUTH Context] Logging out and purging session tokens.');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
