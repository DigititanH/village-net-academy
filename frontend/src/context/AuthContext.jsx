import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const saved = localStorage.getItem("user");
    if (!saved || saved === "undefined" || saved === "null") return null;
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      const saved = readStoredUser();
      if (saved) setUser(saved);
      api.get("/auth/me").then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }).catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      });
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (!res.data?.token) {
      throw new Error(res.data?.message || "Login failed");
    }
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password, role, academy, affiliation) => {
    const res = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
      academy,
      affiliation,
    });
    if (res.data.pending || res.data.pending_verification || !res.data.token) {
      return {
        ...(res.data.user || {}),
        pending: !!res.data.pending,
        pending_verification: !!res.data.pending_verification || !res.data.token,
        message: res.data.message,
      };
    }
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const refreshUser = async () => {
    const res = await api.get("/auth/me");
    setUser(res.data.user);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
