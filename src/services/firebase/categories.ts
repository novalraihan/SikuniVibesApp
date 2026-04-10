import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Category } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION_NAME = 'categories';

let categoriesCache: Category[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const getCategories = async (activeOnly = false): Promise<Category[]> => {
  const now = Date.now();
  if (categoriesCache && (now - lastFetchTime < CACHE_DURATION)) {
    return activeOnly ? categoriesCache.filter(c => c.isActive) : categoriesCache;
  }

  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const q = activeOnly ? query(categoriesRef, where('isActive', '==', true)) : categoriesRef;
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => doc.data() as Category);
    
    if (!activeOnly) {
      categoriesCache = categories;
      lastFetchTime = now;
    }
    
    return categories;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const getCategory = async (id: string): Promise<Category | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as Category;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${id}`);
    return null;
  }
};

const generateReadableId = (prefix: string) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = `${prefix}-`;
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export const createCategory = async (categoryData: Omit<Category, 'id'>): Promise<string> => {
  try {
    const customId = generateReadableId('CAT');
    const docRef = doc(db, COLLECTION_NAME, customId);
    const newCategory: Category = {
      ...categoryData,
      id: customId,
    };
    await setDoc(docRef, newCategory);
    categoriesCache = null;
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    throw error;
  }
};

export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, categoryData);
    categoriesCache = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    categoriesCache = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
};
