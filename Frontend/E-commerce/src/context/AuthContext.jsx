import { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setAuthLoading(false);  // đánh dấu đã đọc xong localStorage
  }, []);

  // Khi app load lại, đọc user từ localStorage để không mất session
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = async (email, password) => {
    try {

      const res = await authApi.login({ email, password });

      const { token, name, roleNames } = res.data;

      const userData = { name, email, roleNames };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { ok: true, roleNames };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Đăng nhập thất bại' };
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      await authApi.register({ name, email, phoneNumber: phone, password });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Đăng ký thất bại' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      authLoading,
      user,
      login,
      logout,
      register,
      isAdmin: user?.roleNames?.includes('Admin') ?? false,
      isStaff: user?.roleNames?.includes('Staff') ?? false,
      isCustomer: user?.roleNames?.includes('Customer') ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
