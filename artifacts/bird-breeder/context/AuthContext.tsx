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

function mapFirebaseError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Geçersiz e-posta adresi.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-posta veya şifre hatalı.";
    case "auth/user-not-found":
      return "Bu e-posta ile kayıtlı hesap bulunamadı.";
    case "auth/email-already-in-use":
      return "Bu e-posta adresi zaten kullanımda.";
    case "auth/weak-password":
      return "Şifre çok zayıf — en az 6 karakter kullanın.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı. Lütfen biraz bekleyin.";
    case "auth/network-request-failed":
      return "Ağ hatası. İnternet bağlantınızı kontrol edin.";
    case "auth/unauthorized-domain":
      return "Bu alan adı Firebase'de yetkili değil. Firebase Console → Authentication → Settings → Authorized domains'e ekleyin.";
    case "auth/requires-recent-login":
      return "Güvenlik nedeniyle çıkış yapıp tekrar giriş yapın, ardından hesabı silin.";
    default:
      return `Hata (${code || "bilinmeyen"}). Tekrar deneyin.`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state — fires immediately on app open with cached session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // AUTO-REGISTER: try login → if user not found/invalid-cred → create account
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const norm = email.toLowerCase().trim();
    if (!norm || !password)
      return { success: false, error: "E-posta ve şifre gereklidir." };

    try {
      await signInWithEmailAndPassword(auth, norm, password);
      return { success: true };
    } catch (signInErr: any) {
      const code: string = signInErr?.code ?? "";

      // User doesn't exist yet → auto-register
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, norm, password);
          return { success: true };
        } catch (regErr: any) {
          const regCode: string = regErr?.code ?? "";
          // Email exists but wrong password
          if (regCode === "auth/email-already-in-use")
            return { success: false, error: "Şifre hatalı. Lütfen tekrar deneyin." };
          return { success: false, error: mapFirebaseError(regCode) };
        }
      }

      return { success: false, error: mapFirebaseError(code) };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // REAL password reset via Firebase — sends link to user's inbox
  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const norm = email.toLowerCase().trim();
    if (!norm) return { success: false, error: "E-posta adresi gereklidir." };
    try {
      await sendPasswordResetEmail(auth, norm);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapFirebaseError(err?.code ?? "") };
    }
  };

  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) throw Object.assign(new Error("Oturum bulunamadı."), { code: "auth/no-current-user" });
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
