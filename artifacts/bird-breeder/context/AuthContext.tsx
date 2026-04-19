import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userEmail: null,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const email = await AsyncStorage.getItem("auth_email");
        if (email) {
          setUserEmail(email);
          setIsLoggedIn(true);
        }
      } catch (_) {}
    };
    load();
  }, []);

  const login = async (email: string) => {
    await AsyncStorage.setItem("auth_email", email);
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_email");
    setUserEmail(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
