import { useCallback, useEffect, useState } from "react";
import { authApi, notificationApi } from "../services/api";
import { AuthContext } from "./AuthContextValue";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const summary = await notificationApi.summary();
      setUnreadCount(summary.data.unreadCount ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.authenticated ? data : null);
      if (data.authenticated) {
        await refreshUnreadCount();
      } else {
        setUnreadCount(0);
      }
      return data.authenticated ? data : null;
    } catch {
      setUser(null);
      setUnreadCount(0);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const signIn = async (payload) => {
    const { data } = await authApi.login(payload);
    setUser(data);
    await refreshUnreadCount();
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
