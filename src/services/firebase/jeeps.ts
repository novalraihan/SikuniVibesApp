import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Jeep } from '../../types';

const COLLECTION_NAME = 'jeeps';

export const getJeeps = async (onlyActive = true): Promise<Jeep[]> => {
  try {
    const jeepsCol = collection(db, COLLECTION_NAME);
    let q;
    
    if (onlyActive) {
      q = query(jeepsCol, where('isActive', '==', true));
    } else {
      q = query(jeepsCol);
    }
    
    const snapshot = await getDocs(q);
    const jeeps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    } as Jeep));

    // Sort in memory to avoid composite index requirement
    return jeeps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.error("Error fetching jeeps:", error);
    return [];
  }
};

export const getJeepById = async (id: string): Promise<Jeep | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...(snapshot.data() as any) } as Jeep;
    }
    return null;
  } catch (error) {
    console.error("Error fetching jeep by id:", error);
    return null;
  }
};

export const createJeep = async (jeep: Omit<Jeep, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const jeepsCol = collection(db, COLLECTION_NAME);
  const now = Date.now();
  const docRef = await addDoc(jeepsCol, {
    ...jeep,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateJeep = async (id: string, jeep: Partial<Jeep>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...jeep,
    updatedAt: Date.now()
  });
};

export const deleteJeep = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
