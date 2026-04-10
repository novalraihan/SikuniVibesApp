import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION_NAME = 'wishlists';

export interface WishlistItem {
  id: string; // userId_propertyId
  userId: string;
  propertyId: string;
  createdAt: any;
}

export const toggleWishlist = async (userId: string, propertyId: string): Promise<boolean> => {
  try {
    const id = `${userId}_${propertyId}`;
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Check if exists
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      // Remove
      await deleteDoc(docRef);
      return false; // not in wishlist anymore
    } else {
      // Add
      await setDoc(docRef, {
        id,
        userId,
        propertyId,
        createdAt: serverTimestamp()
      });
      return true; // added to wishlist
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    return false;
  }
};

export const getUserWishlist = async (userId: string): Promise<string[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().propertyId as string);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};
