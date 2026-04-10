import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Property } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION = 'properties';

let activePropertiesCache: Property[] | null = null;
let allPropertiesCache: Property[] | null = null;
let lastFetchTimeActive = 0;
let lastFetchTimeAll = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getActiveProperties = async (): Promise<Property[]> => {
  const now = Date.now();
  if (activePropertiesCache && (now - lastFetchTimeActive < CACHE_DURATION)) {
    return activePropertiesCache;
  }

  try {
    const q = query(collection(db, COLLECTION), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    const properties = snapshot.docs.map(doc => doc.data() as Property);
    activePropertiesCache = properties.sort((a, b) => b.createdAt - a.createdAt);
    lastFetchTimeActive = now;
    return activePropertiesCache;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return [];
  }
};

export const getProperties = async (): Promise<Property[]> => {
  const now = Date.now();
  if (allPropertiesCache && (now - lastFetchTimeAll < CACHE_DURATION)) {
    return allPropertiesCache;
  }

  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    allPropertiesCache = snapshot.docs.map(doc => doc.data() as Property);
    lastFetchTimeAll = now;
    return allPropertiesCache;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return [];
  }
};

export const getProperty = async (id: string): Promise<Property | null> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as Property;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${id}`);
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

export const createProperty = async (data: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'bookedDates' | 'ratingAverage' | 'reviewCount'>): Promise<void> => {
  try {
    const customId = generateReadableId('PRP');
    const docRef = doc(db, COLLECTION, customId);
    const now = Date.now();
    const newProperty: Property = {
      ...data,
      id: customId,
      units: data.units || [],
      bookedDates: [],
      ratingAverage: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newProperty);
    activePropertiesCache = null;
    allPropertiesCache = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
};

export const updateProperty = async (id: string, data: Partial<Property>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    });
    activePropertiesCache = null;
    allPropertiesCache = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
  }
};

export const deleteProperty = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
    activePropertiesCache = null;
    allPropertiesCache = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${id}`);
  }
};
