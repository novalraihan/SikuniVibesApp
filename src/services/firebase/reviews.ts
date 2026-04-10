import { collection, doc, getDocs, setDoc, query, where, orderBy, serverTimestamp, updateDoc, increment, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION_NAME = 'reviews';

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export const getPropertyReviews = async (propertyId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('propertyId', '==', propertyId)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => doc.data() as Review);
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const createReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const docRef = doc(collection(db, COLLECTION_NAME));
    const newReview: Review = {
      ...reviewData,
      id: docRef.id,
      createdAt: Date.now(),
    };
    
    await setDoc(docRef, newReview);

    // Update property rating
    await recalculatePropertyRating(reviewData.propertyId);

  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateReview = async (id: string, propertyId: string, data: Partial<Review>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
    await recalculatePropertyRating(propertyId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const deleteReview = async (id: string, propertyId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    await recalculatePropertyRating(propertyId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};

const recalculatePropertyRating = async (propertyId: string) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('propertyId', '==', propertyId));
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => doc.data() as Review);
    
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / count : 0;
    
    const propertyRef = doc(db, 'properties', propertyId);
    await updateDoc(propertyRef, {
      reviewCount: count,
      ratingAverage: avg
    });
  } catch (error) {
    console.error("Error recalculating rating:", error);
  }
};
