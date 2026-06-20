import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const MOCK_EMAIL = "rodrigo@jadeia.com.br";
const MOCK_PASSWORD = "jade2026";
const AUTH_KEY = "@jade_ia:auth";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((val) => {
      if (val === "1") setIsLoggedIn(true);
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (
      email.trim().toLowerCase() === MOCK_EMAIL &&
      password === MOCK_PASSWORD
    ) {
      await AsyncStorage.setItem(AUTH_KEY, "1");
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
