import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Attraction } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION_NAME = 'attractions';

let attractionsCache: Attraction[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const getAttractions = async (onlyActive = false): Promise<Attraction[]> => {
  const now = Date.now();
  if (attractionsCache && (now - lastFetchTime < CACHE_DURATION)) {
    return onlyActive ? attractionsCache.filter(a => a.isActive) : attractionsCache;
  }

  try {
    const attractionsRef = collection(db, COLLECTION_NAME);
    const q = query(attractionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const attractions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Attraction[];
    
    attractionsCache = attractions;
    lastFetchTime = now;
    
    return onlyActive ? attractions.filter(a => a.isActive) : attractions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const getAttraction = async (id: string): Promise<Attraction | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Attraction;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${id}`);
    return null;
  }
};

export const createAttraction = async (data: Omit<Attraction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = Date.now();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    attractionsCache = null;
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    throw error;
  }
};

export const updateAttraction = async (id: string, data: Partial<Attraction>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now()
    });
    attractionsCache = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};

export const deleteAttraction = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    attractionsCache = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};
