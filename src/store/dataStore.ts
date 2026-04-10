import { create } from 'zustand';
import { Property, Category, Promo, Jeep, TourPackage, Attraction } from '../types';
import { Blog } from '../services/firebase/blogs';
import { SiteSettings } from '../services/firebase/settings';

interface DataState {
  properties: Property[];
  propertiesWithPromos: Property[];
  categories: Category[];
  promos: Promo[];
  blogs: Blog[];
  jeeps: Jeep[];
  tourPackages: TourPackage[];
  attractions: Attraction[];
  settings: SiteSettings | null;
  isDataReady: boolean;
  
  setData: (data: Partial<DataState>) => void;
  setDataReady: (isReady: boolean) => void;
}

export const useDataStore = create<DataState>((set) => ({
  properties: [],
  propertiesWithPromos: [],
  categories: [],
  promos: [],
  blogs: [],
  jeeps: [],
  tourPackages: [],
  attractions: [],
  settings: null,
  isDataReady: false,
  
  setData: (data) => set((state) => ({ ...state, ...data })),
  setDataReady: (isReady) => set({ isDataReady: isReady }),
}));
