import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Promo } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION_NAME = 'promos';

export const getPromos = async (activeOnly = false): Promise<Promo[]> => {
  try {
    const promosRef = collection(db, COLLECTION_NAME);
    let q = query(promosRef);
    
    if (activeOnly) {
      q = query(
        promosRef, 
        where('isActive', '==', true)
      );
    }
    
    const snapshot = await getDocs(q);
    let promos = snapshot.docs.map(doc => doc.data() as Promo);
    
    // Sort by createdAt desc
    promos.sort((a, b) => b.createdAt - a.createdAt);
    
    if (activeOnly) {
      const now = Date.now();
      promos = promos.filter(p => {
        const isDateValid = p.startDate <= now && p.endDate >= now;
        const isUsageValid = !p.maxUsage || p.maxUsage === 0 || (p.currentUsage || 0) < p.maxUsage;
        return isDateValid && !p.isHidden && isUsageValid;
      });
    }
    
    return promos;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const getPromoByCode = async (code: string): Promise<Promo | null> => {
  try {
    const promosRef = collection(db, COLLECTION_NAME);
    const q = query(promosRef, where('code', '==', code.toUpperCase()), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const promo = snapshot.docs[0].data() as Promo;
    const now = Date.now();
    
    const isDateValid = promo.startDate <= now && promo.endDate >= now;
    const isUsageValid = !promo.maxUsage || promo.maxUsage === 0 || (promo.currentUsage || 0) < promo.maxUsage;
    
    if (isDateValid && isUsageValid) {
      return promo;
    }
    
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return null;
  }
};

export const getPromo = async (id: string): Promise<Promo | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as Promo;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${id}`);
    return null;
  }
};

export const createPromo = async (promoData: Omit<Promo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = doc(collection(db, COLLECTION_NAME));
    const now = Date.now();
    const newPromo: Promo = {
      ...promoData,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newPromo);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    throw error;
  }
};

export const updatePromo = async (id: string, promoData: Partial<Promo>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { ...promoData, updatedAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};

export const deletePromo = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};
