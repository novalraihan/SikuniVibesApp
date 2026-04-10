import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { TourPackage } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION = 'tour-packages';

export const getTourPackages = async (onlyActive = false): Promise<TourPackage[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let packages = snapshot.docs.map(doc => doc.data() as TourPackage);
    
    if (onlyActive) {
      packages = packages.filter(p => p.isActive);
    }
    
    return packages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return [];
  }
};

export const getTourPackage = async (id: string): Promise<TourPackage | null> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as TourPackage) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${id}`);
    return null;
  }
};

export const createTourPackage = async (data: Omit<TourPackage, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const docRef = doc(collection(db, COLLECTION));
    const now = Date.now();
    const newPackage: TourPackage = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newPackage);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
};

export const updateTourPackage = async (id: string, data: Partial<TourPackage>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
  }
};

export const deleteTourPackage = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${id}`);
  }
};
