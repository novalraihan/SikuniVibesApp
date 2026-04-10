/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { FirebaseProvider } from './providers/FirebaseProvider';
import { getSiteSettings } from './services/firebase/settings';
import { incrementAffiliateClicks } from './services/firebase/users';
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OnboardingModal } from './components/OnboardingModal';

// Lazy load public pages
const Home = lazy(() => import('./pages/public/Home').then(module => ({ default: module.Home })));
const Explore = lazy(() => import('./pages/public/Explore').then(module => ({ default: module.Explore })));
const Promos = lazy(() => import('./pages/public/Promos').then(module => ({ default: module.Promos })));
const PropertyDetails = lazy(() => import('./pages/public/PropertyDetails').then(module => ({ default: module.PropertyDetails })));
const CategoryPage = lazy(() => import('./pages/public/CategoryPage').then(module => ({ default: module.CategoryPage })));
const Checkout = lazy(() => import('./pages/public/Checkout').then(module => ({ default: module.Checkout })));
const BlogList = lazy(() => import('./pages/public/BlogList'));
const BlogDetail = lazy(() => import('./pages/public/BlogDetail'));
const Attractions = lazy(() => import('./pages/public/Attractions'));
const Login = lazy(() => import('./pages/public/Login'));
const AffiliateCenter = lazy(() => import('./pages/public/AffiliateCenter'));

// Lazy load user pages
const Profile = lazy(() => import('./pages/user/Profile').then(module => ({ default: module.Profile })));
const Wishlist = lazy(() => import('./pages/user/Wishlist').then(module => ({ default: module.Wishlist })));

// Lazy load admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const PropertiesList = lazy(() => import('./pages/admin/PropertiesList').then(module => ({ default: module.PropertiesList })));
const PropertyForm = lazy(() => import('./pages/admin/PropertyForm').then(module => ({ default: module.PropertyForm })));
const CategoriesList = lazy(() => import('./pages/admin/CategoriesList').then(module => ({ default: module.CategoriesList })));
const CategoryForm = lazy(() => import('./pages/admin/CategoryForm').then(module => ({ default: module.CategoryForm })));
const PromosList = lazy(() => import('./pages/admin/PromosList').then(module => ({ default: module.PromosList })));
const PromoForm = lazy(() => import('./pages/admin/PromoForm').then(module => ({ default: module.PromoForm })));
const SettingsForm = lazy(() => import('./pages/admin/SettingsForm').then(module => ({ default: module.SettingsForm })));
const AmenitiesList = lazy(() => import('./pages/admin/AmenitiesList').then(module => ({ default: module.AmenitiesList })));
const AmenityForm = lazy(() => import('./pages/admin/AmenityForm').then(module => ({ default: module.AmenityForm })));
const UsersList = lazy(() => import('./pages/admin/UsersList').then(module => ({ default: module.UsersList })));
const BookingsList = lazy(() => import('./pages/admin/BookingsList').then(module => ({ default: module.BookingsList })));
const AdminBookingForm = lazy(() => import('./pages/admin/AdminBookingForm').then(module => ({ default: module.AdminBookingForm })));
const CalendarView = lazy(() => import('./pages/admin/CalendarView').then(module => ({ default: module.CalendarView })));
const ChatManagement = lazy(() => import('./pages/admin/ChatManagement').then(module => ({ default: module.ChatManagement })));
const BlogsList = lazy(() => import('./pages/admin/BlogsList').then(module => ({ default: module.BlogsList })));
const BlogForm = lazy(() => import('./pages/admin/BlogForm').then(module => ({ default: module.BlogForm })));
const CommunicationCenter = lazy(() => import('./pages/admin/CommunicationCenter').then(module => ({ default: module.CommunicationCenter })));
const JeepsList = lazy(() => import('./pages/admin/JeepsList').then(module => ({ default: module.JeepsList })));
const JeepForm = lazy(() => import('./pages/admin/JeepForm').then(module => ({ default: module.JeepForm })));
const AddOnsList = lazy(() => import('./pages/admin/AddOnsList').then(module => ({ default: module.AddOnsList })));
const AddOnForm = lazy(() => import('./pages/admin/AddOnForm').then(module => ({ default: module.AddOnForm })));
const TourPackagesList = lazy(() => import('./pages/admin/TourPackagesList').then(module => ({ default: module.TourPackagesList })));
const TourPackageForm = lazy(() => import('./pages/admin/TourPackageForm').then(module => ({ default: module.TourPackageForm })));
const AttractionsList = lazy(() => import('./pages/admin/AttractionsList').then(module => ({ default: module.AttractionsList })));
const AttractionForm = lazy(() => import('./pages/admin/AttractionForm').then(module => ({ default: module.AttractionForm })));
const SurveyDashboard = lazy(() => import('./pages/admin/SurveyDashboard').then(module => ({ default: module.SurveyDashboard })));
const Settings = lazy(() => import('./pages/user/Settings').then(module => ({ default: module.Settings })));
const AffiliatesList = lazy(() => import('./pages/admin/AffiliatesList').then(module => ({ default: module.AffiliatesList })));
const WithdrawalsList = lazy(() => import('./pages/admin/WithdrawalsList'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs').then(module => ({ default: module.AdminLogs })));
const TourPackageDetails = lazy(() => import('./pages/public/TourPackageDetails').then(module => ({ default: module.TourPackageDetails })));
const PromoDetail = lazy(() => import('./pages/public/PromoDetail'));
const AttractionDetail = lazy(() => import('./pages/public/AttractionDetail').then(module => ({ default: module.AttractionDetail })));

const CheckBooking = lazy(() => import('./pages/CheckBooking').then(module => ({ default: module.CheckBooking })));
const MapPage = lazy(() => import('./pages/MapPage').then(module => ({ default: module.MapPage })));
const JeepListPage = lazy(() => import('./pages/public/JeepListPage').then(module => ({ default: module.JeepListPage })));
const JeepDetailsPage = lazy(() => import('./pages/public/JeepDetailsPage').then(module => ({ default: module.JeepDetailsPage })));
const About = lazy(() => import('./pages/public/About').then(module => ({ default: module.About })));
const HelpCenter = lazy(() => import('./pages/public/HelpCenter').then(module => ({ default: module.HelpCenter })));
const TermsAndConditions = lazy(() => import('./pages/public/TermsAndConditions').then(module => ({ default: module.TermsAndConditions })));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

export default function App() {
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);

  useEffect(() => {
    // Capture affiliate ref from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      const existingRef = localStorage.getItem('affiliateRef');
      if (existingRef !== ref) {
        localStorage.setItem('affiliateRef', ref);
        incrementAffiliateClicks(ref);
      }
    }

    getSiteSettings().then((settings) => {
      if (settings?.primaryColor) {
        setPrimaryColor(settings.primaryColor);
        // Set CSS variables for Tailwind to use if needed, or just standard CSS variables
        document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
      }
      if (settings?.logoUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.logoUrl;
      }
    });
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <FirebaseProvider>
          <Toaster position="top-center" richColors />
          {primaryColor && (
          <style>
            {`
              :root {
                --color-primary: ${primaryColor};
              }
              .bg-blue-600 { background-color: var(--color-primary) !important; }
              .bg-indigo-600 { background-color: var(--color-primary) !important; }
              .text-blue-600 { color: var(--color-primary) !important; }
              .text-indigo-600 { color: var(--color-primary) !important; }
              .border-blue-600 { border-color: var(--color-primary) !important; }
              .border-indigo-600 { border-color: var(--color-primary) !important; }
              .hover\\:bg-blue-700:hover { filter: brightness(0.9); background-color: var(--color-primary) !important; }
              .hover\\:bg-indigo-700:hover { filter: brightness(0.9); background-color: var(--color-primary) !important; }
              .focus\\:ring-blue-500:focus { --tw-ring-color: var(--color-primary) !important; }
              .focus\\:ring-indigo-500:focus { --tw-ring-color: var(--color-primary) !important; }
            `}
          </style>
        )}
        <BrowserRouter>
          <OnboardingModal />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<MainLayout />}>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/promos" element={<Promos />} />
                <Route path="/promos/:id" element={<PromoDetail />} />
                <Route path="/attractions" element={<Attractions />} />
                <Route path="/attractions/:id" element={<AttractionDetail />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                <Route path="/tour-packages/:id" element={<TourPackageDetails />} />
                <Route path="/jeeps" element={<JeepListPage />} />
                <Route path="/jeeps/:id" element={<JeepDetailsPage />} />
                <Route path="/cek-booking" element={<CheckBooking />} />
                <Route path="/blogs" element={<BlogList />} />
                <Route path="/blogs/:slug" element={<BlogDetail />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/about" element={<About />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                
                <Route path="/checkout/:id" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected User Routes */}
                <Route element={<ProtectedRoute allowedRoles={['user', 'admin', 'super_admin', 'resepsionis']} />}>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/affiliate" element={<AffiliateCenter />} />
                </Route>
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'resepsionis']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/properties" element={<PropertiesList />} />
                  <Route path="/admin/properties/new" element={<PropertyForm />} />
                  <Route path="/admin/properties/:id/edit" element={<PropertyForm />} />
                  
                  <Route path="/admin/categories" element={<CategoriesList />} />
                  <Route path="/admin/categories/new" element={<CategoryForm />} />
                  <Route path="/admin/categories/:id/edit" element={<CategoryForm />} />
                  
                  <Route path="/admin/amenities" element={<AmenitiesList />} />
                  <Route path="/admin/amenities/new" element={<AmenityForm />} />
                  <Route path="/admin/amenities/:id/edit" element={<AmenityForm />} />
                  
                  <Route path="/admin/promos" element={<PromosList />} />
                  <Route path="/admin/promos/new" element={<PromoForm />} />
                  <Route path="/admin/promos/:id/edit" element={<PromoForm />} />
                  
                  <Route path="/admin/users" element={<UsersList />} />
                  <Route path="/admin/bookings" element={<BookingsList />} />
                  <Route path="/admin/bookings/new" element={<AdminBookingForm />} />
                  <Route path="/admin/calendar" element={<CalendarView />} />
                  <Route path="/admin/chats" element={<ChatManagement />} />
                  
                  <Route path="/admin/blogs" element={<BlogsList />} />
                  <Route path="/admin/blogs/new" element={<BlogForm />} />
                  <Route path="/admin/blogs/:id/edit" element={<BlogForm />} />
                  
                  <Route path="/admin/jeeps" element={<JeepsList />} />
                  <Route path="/admin/jeeps/new" element={<JeepForm />} />
                  <Route path="/admin/jeeps/:id/edit" element={<JeepForm />} />

                  <Route path="/admin/addons" element={<AddOnsList />} />
                  <Route path="/admin/addons/new" element={<AddOnForm />} />
                  <Route path="/admin/addons/edit/:id" element={<AddOnForm />} />

                  <Route path="/admin/tour-packages" element={<TourPackagesList />} />
                  <Route path="/admin/tour-packages/new" element={<TourPackageForm />} />
                  <Route path="/admin/tour-packages/edit/:id" element={<TourPackageForm />} />
                  
                  <Route path="/admin/attractions" element={<AttractionsList />} />
                  <Route path="/admin/attractions/new" element={<AttractionForm />} />
                  <Route path="/admin/attractions/edit/:id" element={<AttractionForm />} />
                  
                  <Route path="/admin/surveys" element={<SurveyDashboard />} />
                  <Route path="/admin/affiliates" element={<AffiliatesList />} />
                  <Route path="/admin/withdrawals" element={<WithdrawalsList />} />
                  <Route path="/admin/logs" element={<AdminLogs />} />
                  
                  <Route path="/admin/communication" element={<CommunicationCenter />} />
                  <Route path="/admin/email" element={<Navigate to="/admin/communication" replace />} />
                  <Route path="/admin/templates" element={<Navigate to="/admin/communication" replace />} />
                  <Route path="/admin/settings" element={<SettingsForm />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </FirebaseProvider>
    </ErrorBoundary>
  </HelmetProvider>
  );
}
