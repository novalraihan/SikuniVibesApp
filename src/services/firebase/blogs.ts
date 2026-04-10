import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  author?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

const COLLECTION_NAME = 'blogs';

export const getBlogs = async (onlyActive = true): Promise<Blog[]> => {
  try {
    let q = query(collection(db, COLLECTION_NAME));
    
    if (onlyActive) {
      q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true));
    }
    
    const snapshot = await getDocs(q);
    const blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
    
    // Sort in memory to avoid requiring a composite index in Firestore
    return blogs.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting blogs:', error);
    throw error;
  }
};

export const getBlogBySlug = async (slug: string): Promise<Blog | null> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Blog;
  } catch (error) {
    console.error('Error getting blog by slug:', error);
    throw error;
  }
};

export const getBlogById = async (id: string): Promise<Blog | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return { id: snapshot.id, ...snapshot.data() } as Blog;
  } catch (error) {
    console.error('Error getting blog:', error);
    throw error;
  }
};

export const getBlog = getBlogById;

export const createBlog = async (blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...blogData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Update the document with its ID
    await updateDoc(docRef, { id: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating blog:', error);
    throw error;
  }
};

export const updateBlog = async (id: string, blogData: Partial<Blog>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...blogData,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    throw error;
  }
};

export const deleteBlog = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting blog:', error);
    throw error;
  }
};
