import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";

export const MAX_BIRDS = 25;

export interface Bird {
  id: string;
  name: string;
  ringNo: string;
  breed: string;
  species: string;
  gender: "male" | "female" | "unknown";
  fatherId?: string;
  motherId?: string;
  imageUri?: string;
  storagePath?: string;
  dateOfBirth?: string;
  notes?: string;
  color?: string;
}

interface BirdsContextType {
  birds: Bird[];
  canAddBird: boolean;
  addBird: (bird: Omit<Bird, "id">) => Promise<{ success: boolean; reason?: string }>;
  updateBird: (id: string, updates: Partial<Bird>) => Promise<void>;
  deleteBird: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const BirdsContext = createContext<BirdsContextType>({
  birds: [],
  canAddBird: true,
  addBird: async () => ({ success: false }),
  updateBird: async () => {},
  deleteBird: async () => {},
  clearAll: async () => {},
});

function isLocalUri(uri: string) {
  return (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("/") ||
    uri.startsWith("ph://") ||
    uri.startsWith("blob:")
  );
}

async function uploadImage(
  uid: string,
  birdId: string,
  uri: string
): Promise<{ url: string; path: string }> {
  const path = `birds/${uid}/${birdId}`;
  const storageRef = ref(storage, path);
  const response = await fetch(uri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export function BirdsProvider({ children }: { children: React.ReactNode }) {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) {
      setBirds([]);
      return;
    }
    const col = collection(db, "users", uid, "birds");
    const unsub = onSnapshot(col, (snap) => {
      setBirds(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bird)));
    });
    return unsub;
  }, [uid]);

  const canAddBird = birds.length < MAX_BIRDS;

  const addBird = async (
    bird: Omit<Bird, "id">
  ): Promise<{ success: boolean; reason?: string }> => {
    if (!uid) return { success: false, reason: "Giriş yapılmamış." };
    if (!canAddBird)
      return { success: false, reason: `En fazla ${MAX_BIRDS} kuş eklenebilir.` };

    const col = collection(db, "users", uid, "birds");
    const docRef = await addDoc(col, { placeholder: true });
    const birdId = docRef.id;

    let imageUri = bird.imageUri;
    let storagePath: string | undefined;

    if (imageUri && isLocalUri(imageUri)) {
      const uploaded = await uploadImage(uid, birdId, imageUri);
      imageUri = uploaded.url;
      storagePath = uploaded.path;
    }

    await updateDoc(docRef, {
      ...bird,
      id: birdId,
      imageUri: imageUri ?? null,
      storagePath: storagePath ?? null,
      placeholder: false,
    });

    return { success: true };
  };

  const updateBird = async (
    id: string,
    updates: Partial<Bird>
  ): Promise<void> => {
    if (!uid) return;
    const bird = birds.find((b) => b.id === id);
    let imageUri = updates.imageUri;
    let storagePath = updates.storagePath ?? bird?.storagePath;

    if (imageUri && isLocalUri(imageUri)) {
      if (bird?.storagePath) {
        try {
          await deleteObject(ref(storage, bird.storagePath));
        } catch {}
      }
      const uploaded = await uploadImage(uid, id, imageUri);
      imageUri = uploaded.url;
      storagePath = uploaded.path;
    }

    await updateDoc(doc(db, "users", uid, "birds", id), {
      ...updates,
      imageUri: imageUri ?? null,
      storagePath: storagePath ?? null,
    });
  };

  const deleteBird = async (id: string): Promise<void> => {
    if (!uid) return;
    const bird = birds.find((b) => b.id === id);
    if (bird?.storagePath) {
      try {
        await deleteObject(ref(storage, bird.storagePath));
      } catch {}
    }
    await deleteDoc(doc(db, "users", uid, "birds", id));
  };

  const clearAll = async (): Promise<void> => {
    if (!uid) return;
    const col = collection(db, "users", uid, "birds");
    const snap = await getDocs(col);
    const batch = writeBatch(db);
    for (const d of snap.docs) {
      const bird = d.data() as Bird;
      if (bird.storagePath) {
        try {
          await deleteObject(ref(storage, bird.storagePath));
        } catch {}
      }
      batch.delete(d.ref);
    }
    await batch.commit();
  };

  return (
    <BirdsContext.Provider
      value={{ birds, canAddBird, addBird, updateBird, deleteBird, clearAll }}
    >
      {children}
    </BirdsContext.Provider>
  );
}

export const useBirds = () => useContext(BirdsContext);
