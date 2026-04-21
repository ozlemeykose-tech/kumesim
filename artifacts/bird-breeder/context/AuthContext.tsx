import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  User,
  onAuthStateChanged,
  signOut,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  uid: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  userPhoto: string | null;
  loading: boolean;
  loginWithGoogle: (idToken?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  uid: null,
  userEmail: null,
  userDisplayName: null,
  userPhoto: null,
  loading: true,
  loginWithGoogle: async () => ({ success: false }),
  logout: async () => {},
  deleteAccount: async () => {},
});

function mapFirebaseError(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google girişi iptal edildi.";
    case "auth/popup-blocked":
      return "Tarayıcınız açılır pencereyi engelledi. Lütfen izin verin.";
    case "auth/account-exists-with-different-credential":
      return "Bu e-posta farklı bir yöntemle kayıtlı.";
    case "auth/network-request-failed":
      return "Ağ hatası. İnternet bağlantınızı kontrol edin.";
    case "auth/unauthorized-domain":
      return "Bu alan adı Firebase'de yetkili değil.";
    case "auth/requires-recent-login":
      return "Güvenlik için çıkış yapıp tekrar giriş yapın.";
    case "auth/too-many-requests":
      return "Çok fazla deneme. Lütfen bekleyin.";
    default:
      return `Giriş başarısız (${code || "bilinmeyen"}). Tekrar deneyin.`;
  }
}

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

  const loginWithGoogle = async (
    idToken?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (Platform.OS === "web") {
        // Web: popup flow — works immediately, no extra credentials needed
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
        return { success: true };
      } else {
        // Native: idToken comes from expo-auth-session (login.tsx)
        if (!idToken) return { success: false, error: "Google token alınamadı." };
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: mapFirebaseError(err?.code ?? "") };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) throw new Error("Oturum bulunamadı.");
    await deleteUser(current);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        uid: user?.uid ?? null,
        userEmail: user?.email ?? null,
        userDisplayName: user?.displayName ?? null,
        userPhoto: user?.photoURL ?? null,
        loading,
        loginWithGoogle,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
