import { create } from 'zustand';
import { toggleWishlist, getUserWishlist } from '../services/firebase/wishlist';

interface WishlistState {
  wishlistIds: string[];
  isLoading: boolean;
  fetchWishlist: (userId?: string) => Promise<void>;
  toggleItem: (userId: string | undefined, propertyId: string) => Promise<void>;
  clearWishlist: () => void;
}

const GUEST_WISHLIST_KEY = 'guest_wishlist';

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistIds: JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || '[]'),
  isLoading: false,
  fetchWishlist: async (userId?: string) => {
    if (!userId) {
      // Guest: load from local storage
      const localIds = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || '[]');
      set({ wishlistIds: localIds });
      return;
    }
    
    set({ isLoading: true });
    try {
      const ids = await getUserWishlist(userId);
      // Merge local wishlist with server wishlist on login
      const localIds = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || '[]');
      const mergedIds = Array.from(new Set([...ids, ...localIds]));
      
      // If there are local items, sync them to server
      if (localIds.length > 0) {
        for (const id of localIds) {
          if (!ids.includes(id)) {
            await toggleWishlist(userId, id);
          }
        }
        localStorage.removeItem(GUEST_WISHLIST_KEY);
      }
      
      set({ wishlistIds: mergedIds });
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    } finally {
      set({ isLoading: false });
    }
  },
  toggleItem: async (userId: string | undefined, propertyId: string) => {
    const current = get().wishlistIds;
    const isWishlisted = current.includes(propertyId);
    
    const newWishlistIds = isWishlisted 
      ? current.filter(id => id !== propertyId)
      : [...current, propertyId];

    // Optimistic update
    set({ wishlistIds: newWishlistIds });

    if (!userId) {
      // Guest: save to local storage
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(newWishlistIds));
      return;
    }

    try {
      await toggleWishlist(userId, propertyId);
    } catch (error) {
      // Revert on error
      set({ wishlistIds: current });
    }
  },
  clearWishlist: () => {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
    set({ wishlistIds: [] });
  },
}));
