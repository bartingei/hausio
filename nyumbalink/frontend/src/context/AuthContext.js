import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      api.get('/accounts/profile/')
        .then(res => setUser(res.data))
        .catch(() => sessionStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/accounts/login/', { email, password });
    sessionStorage.setItem('access_token', res.data.access);
    sessionStorage.setItem('refresh_token', res.data.refresh);
    const profile = await api.get('/accounts/profile/');
    setUser(profile.data);
    return profile.data;
  };

  const logout = () => {
    sessionStorage.clear();
    setUser(null);
  };

  const register = async (data) => {
    const res = await api.post('/accounts/register/', data);
    return res.data;
  };

  // Don't render anything until session is restored
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}