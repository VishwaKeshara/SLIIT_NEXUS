import { createContext, useContext, useEffect, useState } from "react";
import { authApi, notificationApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshAuth = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.authenticated ? data : null);
      if (data.authenticated) {
        const summary = await notificationApi.summary();
        setUnreadCount(summary.data.unreadCount ?? 0);
      } else {
        setUnreadCount(0);
      }
    } catch {
      setUser(null);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const loginAsDevUser = async (email) => {
    const { data } = await authApi.devLogin(email);
    setUser(data);
    const summary = await notificationApi.summary();
    setUnreadCount(summary.data.unreadCount ?? 0);
    return data;
  };

  const signIn = async (payload) => {
    const { data } = await authApi.login(payload);
    setUser(data);
    const summary = await notificationApi.summary();
    setUnreadCount(summary.data.unreadCount ?? 0);
    return data;
  };

  const signUp = async (payload) => {
    const { data } = await authApi.signup(payload);
    setUser(data);
    setUnreadCount(0);
    return data;
  };

  const updateAccount = async (payload) => {
    const { data } = await authApi.updateAccount(payload);
    setUser(data);
    return data;
  };

  const deleteAccount = async () => {
    await authApi.deleteAccount();
    setUser(null);
    setUnreadCount(0);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        unreadCount,
        setUnreadCount,
        refreshAuth,
        loginAsDevUser,
        signIn,
        signUp,
        updateAccount,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
