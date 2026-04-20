import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userEmail: null,
  login: async () => ({ success: false }),
  logout: async () => {},
});

// Password stored per-email: "auth_pw_<email>"
// First login with an email registers that password.
// Every subsequent login must match it exactly.
function pwKey(email: string) {
  return `auth_pw_${email.toLowerCase().trim()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("auth_email").then((email) => {
      if (email) { setUserEmail(email); setIsLoggedIn(true); }
    }).catch(() => {});
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const norm = email.toLowerCase().trim();
    if (!norm || !password) return { success: false, error: "E-posta ve şifre gereklidir." };
    if (password.length < 4) return { success: false, error: "Şifre en az 4 karakter olmalıdır." };

    const stored = await AsyncStorage.getItem(pwKey(norm));
    if (stored === null) {
      // First time: register this password for the email
      await AsyncStorage.setItem(pwKey(norm), password);
    } else if (stored !== password) {
      return { success: false, error: "Şifre hatalı. Lütfen tekrar deneyin." };
    }

    await AsyncStorage.setItem("auth_email", norm);
    setUserEmail(norm);
    setIsLoggedIn(true);
    return { success: true };
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
