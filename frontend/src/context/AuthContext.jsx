import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'
      );
    } catch { return null; }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('token') || sessionStorage.getItem('token') || null
  );

  const login = (tok, userData, remember, role) => {
  // ✅ merge role from either userData or the explicit role arg
  const user = {
    ...userData,
    role: (role || userData?.role || 'USER').toUpperCase(),
  };

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('token', tok);
  storage.setItem('user', JSON.stringify(user));
  setToken(tok);
  setUser(user);
};

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthed: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

