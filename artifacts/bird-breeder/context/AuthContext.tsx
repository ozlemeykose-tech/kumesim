import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  uid: string | null;
  userEmail: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  uid: null,
  userEmail: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  resetPassword: async () => ({ success: false }),
  deleteAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const norm = email.toLowerCase().trim();
    try {
      await signInWithEmailAndPassword(auth, norm, password);
      return { success: true };
    } catch (signInErr: any) {
      const code: string = signInErr.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, norm, password);
          return { success: true };
        } catch (regErr: any) {
          if (regErr.code === "auth/email-already-in-use")
            return { success: false, error: "Şifre hatalı. Lütfen tekrar deneyin." };
          if (regErr.code === "auth/weak-password")
            return { success: false, error: "Şifre çok zayıf, daha güçlü bir şifre seçin." };
          return { success: false, error: "Giriş yapılamadı. Tekrar deneyin." };
        }
      }
      if (code === "auth/wrong-password")
        return { success: false, error: "Şifre hatalı. Lütfen tekrar deneyin." };
      if (code === "auth/invalid-email")
        return { success: false, error: "Geçersiz e-posta adresi." };
      if (code === "auth/too-many-requests")
        return { success: false, error: "Çok fazla deneme. Lütfen biraz bekleyin." };
      return { success: false, error: "Giriş yapılamadı. Tekrar deneyin." };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      return { success: true };
    } catch (err: any) {
      if (err.code === "auth/user-not-found")
        return { success: false, error: "Bu e-posta ile kayıtlı hesap bulunamadı." };
      return { success: false, error: "E-posta gönderilemedi. Tekrar deneyin." };
    }
  };

  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) throw new Error("Kullanıcı oturumu bulunamadı.");
    await deleteUser(current);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        uid: user?.uid ?? null,
        userEmail: user?.email ?? null,
        loading,
        login,
        logout,
        resetPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
