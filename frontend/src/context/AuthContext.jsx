import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("pixelle_token"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("pixelle_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    async function bootstrapUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("pixelle_user", JSON.stringify(data.user));
      } catch (_error) {
        logout();
      } finally {
        setLoading(false);
      }
    }

    bootstrapUser();
  }, [token]);

  function persistAuth(authToken, authUser) {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("pixelle_token", authToken);
    localStorage.setItem("pixelle_user", JSON.stringify(authUser));
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    persistAuth(data.token, data.user);
  }

  async function login(payload) {
    const { data } = await api.post("/auth/login", payload);
    persistAuth(data.token, data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("pixelle_token");
    localStorage.removeItem("pixelle_user");
  }

  function syncUser(nextUser) {
    setUser(nextUser);
    localStorage.setItem("pixelle_user", JSON.stringify(nextUser));
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        register,
        login,
        logout,
        syncUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
