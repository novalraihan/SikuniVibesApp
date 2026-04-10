export type Role = 'user' | 'resepsionis' | 'admin' | 'super_admin';

export interface User {
  uid: string;
  customUserId?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: Role;
  createdAt: number; // Menggunakan timestamp (milliseconds)
  updatedAt?: number;
  address?: string;
  isAffiliate?: boolean;
  onboardingCompleted?: boolean;
  onboardingData?: {
    address?: string;
    phone?: string;
    source?: string;
    knownAttractions?: string[];
    visitCount?: string;
    expectations?: string;
  };
  affiliateStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';
  affiliateCode?: string;
  affiliateBalance?: number;
  affiliatePendingBalance?: number;
  affiliateClicks?: number;
  affiliateBankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  affiliateDetails?: {
    namaKTP: string;
    nik: string;
    alamat: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  isActive: boolean;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  code: string;
  discountAmount: number;
  discountType: 'percentage' | 'flat';
  imageUrl?: string; // This is the banner
  label?: string; // e.g., 'Hemat', 'Spesial'
  labelUrl?: string; // This is the label image
  startDate: number;
  endDate: number;
  isActive: boolean;
  isHidden?: boolean; // If true, it won't show in the public promo list
  applicableProperties?: string[]; // Array of property IDs. If empty or undefined, applies to all.
  maxUsage?: number; // Maximum number of times this promo can be used
  currentUsage?: number; // Current number of times this promo has been used
  createdAt: number;
  updatedAt: number;
}

export interface GalleryImage {
  url: string;
  caption?: string;
  isPrimary: boolean;
}

export interface PropertyUnit {
  id: string;
  name: string;
  description?: string;
  price?: number;
  capacity?: number;
  isActive: boolean;
}

export interface NearbyAttraction {
  attractionId: string;
  distance: number; // in km
}

export interface Property {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  dynamicPrices?: Record<string, number>; // cth: { "2026-12-31": 1500000, "weekend": 800000 }
  images: string[];
  amenities: string[];
  maxGuests: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string; // Alamat lengkap atau deskripsi lokasi
  accommodationRules?: string; // Peraturan Akomodasi
  coordinates?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  affiliateCommission?: number;
  units: PropertyUnit[];
  bookedDates: string[]; // Array of "YYYY-MM-DD"
  unitBookedDates?: Record<number, string[]>; // Map unit index to booked dates
  ratingAverage: number;
  reviewCount: number;
  nearbyAttractions?: NearbyAttraction[];
  createdAt: number;
  updatedAt: number;
  badgeLabel?: string; // e.g., 'Trend', 'Rekomendasi'
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  location: string;
  images: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  category?: string;
  openingHours?: string;
  ticketPrice?: number;
  facilities?: string[];
  tips?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type AddOnCategory = 'BBQ' | 'Jeep' | 'Documentation' | 'Rental' | 'Other';

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: AddOnCategory;
  images?: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TourPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration?: string; // e.g., "2 Days 1 Night"
  includedServices: string[]; // e.g., ["Penginapan", "Jeep", "Tour Guide", "Dokumentasi"]
  propertyIds?: string[];
  attractionIds?: string[];
  images: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type BookingStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  propertyId: string;
  unitId?: string; // Selected unit
  unitName?: string; // Name of the selected unit
  tourPackageId?: string; // If booking a tour package
  addOnIds?: string[]; // Selected add-on IDs (deprecated, prefer addOns)
  addOns?: {
    addOnId: string;
    quantity: number;
    price: number;
  }[];
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string; // "YYYY-MM-DD"
  checkOutDate: string; // "YYYY-MM-DD"
  totalAmount: number;
  paymentType?: 'full' | 'dp'; // full payment or down payment
  dpAmount?: number; // amount paid as DP
  voucherCode?: string; // applied voucher code
  discountAmount?: number; // amount discounted
  status: BookingStatus;
  paymentUrl?: string;
  createdAt: number;
  updatedAt: number;
  affiliateId?: string;
  commissionAmount?: number;
  commissionStatus?: 'pending' | 'ready' | 'paid' | 'cancelled';
  propertyName?: string;
  guests?: number;
  bookingTime?: string; // Format: "HH:mm, DD MMM YYYY"
}

export type PaymentStatus = 'pending' | 'settlement' | 'expire' | 'cancel';
export type PaymentMethod = 'bank_transfer' | 'gopay' | 'qris' | 'credit_card' | string;

export interface Withdrawal {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id: string; // Midtrans transaction_id
  bookingId: string;
  userId: string;
  grossAmount: number;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  snapToken?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Review {
  id: string;
  propertyId: string;
  bookingId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: number;
}

export interface Jeep {
  id: string;
  name: string;
  description: string;
  engine: string;
  capacity: number;
  pricePerDay: number;
  images: string[];
  rules: string[];
  regulations: string[];
  attractionIds?: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

declare global {
  interface Window {
    snap: any;
  }
}
