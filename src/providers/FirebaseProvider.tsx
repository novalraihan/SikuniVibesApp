import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';
import { clearExpiredPendingBookings } from '../services/firebase/bookings';

interface Props {
  children: ReactNode;
}

export function FirebaseProvider({ children }: Props) {
  const { setUser, setAuthReady } = useAuthStore();
  const { fetchWishlist, clearWishlist } = useWishlistStore();

  useEffect(() => {
    // Run cleanup for expired bookings
    clearExpiredPendingBookings();
    
    // Run every 5 minutes
    const interval = setInterval(() => {
      clearExpiredPendingBookings();
    }, 5 * 60 * 1000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          fetchWishlist(firebaseUser.uid);
          // Check if user exists in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            // Ensure novalaron89@gmail.com is always a super_admin
            if (userData.email === 'novalaron89@gmail.com' && userData.role !== 'super_admin') {
              await updateDoc(userRef, { role: 'super_admin' });
              setUser({ ...userData, role: 'super_admin' });
            } else {
              setUser(userData);
            }
          } else {
            // Create new user document
            const isSuperAdmin = firebaseUser.email === 'novalaron89@gmail.com';
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: isSuperAdmin ? 'super_admin' : 'user',
              createdAt: Date.now(),
            };
            
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          // We don't throw handleFirestoreError here because it would prevent setAuthReady from being called
        } finally {
          setAuthReady(true);
        }
      } else {
        setUser(null);
        fetchWishlist(); // Load guest wishlist
        setAuthReady(true);
      }
    });

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [setUser, setAuthReady]);

  return <>{children}</>;
}
