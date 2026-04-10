import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setAuthReady: (isReady: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setAuthReady: (isReady) => set({ isAuthReady: isReady }),
}));
