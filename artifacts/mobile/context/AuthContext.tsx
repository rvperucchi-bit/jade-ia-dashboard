import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

const AUTH_KEY = "@jade_ia:auth_token";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

// Fallback credentials (used if server is unreachable)
const FALLBACK_EMAIL = process.env.EXPO_PUBLIC_JADE_EMAIL ?? "rodrigo@jadeia.com.br";
const FALLBACK_PASSWORD = process.env.EXPO_PUBLIC_JADE_PASSWORD ?? "jade2026";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  authToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((token) => {
      if (token) {
        setAuthToken(token);
        setIsLoggedIn(true);
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Try API first
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (res.ok) {
        const data = (await res.json()) as { token?: string };
        if (data.token) {
          await AsyncStorage.setItem(AUTH_KEY, data.token);
          setAuthToken(data.token);
          setIsLoggedIn(true);
          return true;
        }
      }
      // 401/403 = server explicitly rejected credentials → fail immediately
      if (res.status === 401 || res.status === 403) return false;
      // 5xx / 502 / etc. = server unavailable → fall through to offline fallback
    } catch {
      // Network error — fall through to offline fallback
    }

    // Offline fallback (server unreachable or returned a server error)
    if (
      email.trim().toLowerCase() === FALLBACK_EMAIL.toLowerCase() &&
      password === FALLBACK_PASSWORD
    ) {
      const token = "offline-" + Date.now();
      await AsyncStorage.setItem(AUTH_KEY, token);
      setAuthToken(token);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setAuthToken(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, authToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
