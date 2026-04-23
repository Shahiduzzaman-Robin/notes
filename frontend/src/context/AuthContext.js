"use client";
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:5005/api`;
      const { data } = await axios.post(`${apiUrl}/auth/login`, { email, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5005/api';
      const { data } = await axios.post(`${apiUrl}/auth/register`, { name, email, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
