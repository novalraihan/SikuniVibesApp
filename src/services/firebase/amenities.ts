import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Amenity } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION_NAME = 'amenities';

export const getAllAmenities = async (): Promise<Amenity[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Amenity);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return [];
  }
};

export const getAmenity = async (id: string): Promise<Amenity | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Amenity;
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

export const createAmenity = async (amenity: Omit<Amenity, 'id'>): Promise<void> => {
  try {
    const customId = generateReadableId('AMN');
    const docRef = doc(db, COLLECTION_NAME, customId);
    await setDoc(docRef, { ...amenity, id: customId });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateAmenity = async (id: string, data: Partial<Amenity>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const deleteAmenity = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};
