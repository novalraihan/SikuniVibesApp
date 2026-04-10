import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getUserBookings } from '../../services/firebase/bookings';
import { Booking, Property } from '../../types';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight, Eye, Settings, ClipboardList, User as UserIcon, TrendingUp, ArrowLeft, Info, LogOut, Heart, History, MapPin } from 'lucide-react';
import { BookingDetailModal } from '../../components/booking/BookingDetailModal';
import { SurveyModal } from '../../components/user/SurveyModal';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { logOut } from '../../services/firebase/auth';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useWishlistStore } from '../../store/wishlistStore';
import { getActiveProperties } from '../../services/firebase/properties';

interface SurveyQuestion {
  id: string;
  type: 'single' | 'multiple' | 'essay';
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyForm {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  createdAt: number;
}

export function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { wishlistIds, fetchWishlist } = useWishlistStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [surveys, setSurveys] = useState<SurveyForm[]>([]);
  const [answeredSurveyIds, setAnsweredSurveyIds] = useState<string[]>([]);
  const [wishlistProperties, setWishlistProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyForm | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [bookingsData, surveysSnapshot, responsesSnapshot] = await Promise.all([
            getUserBookings(user.uid),
            getDocs(query(collection(db, 'surveys'), where('isActive', '==', true))),
            getDocs(query(collection(db, 'survey_responses'), where('userId', '==', user.uid))),
            fetchWishlist(user.uid)
          ]);
          
          setBookings(bookingsData);
          const fetchedSurveys = surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyForm));
          fetchedSurveys.sort((a, b) => b.createdAt - a.createdAt);
          setSurveys(fetchedSurveys);
          setAnsweredSurveyIds(responsesSnapshot.docs.map(doc => doc.data().surveyId));
        } catch (error) {
          console.error("Error fetching profile data:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    } else {
      navigate('/login');
    }
  }, [user, navigate, fetchWishlist]);

  useEffect(() => {
    const fetchWishlistDetails = async () => {
      if (wishlistIds.length > 0) {
        try {
          const allProps = await getActiveProperties();
          const filtered = allProps.filter(p => wishlistIds.includes(p.id));
          setWishlistProperties(filtered);
        } catch (error) {
          console.error("Error fetching wishlist properties:", error);
        }
      } else {
        setWishlistProperties([]);
      }
    };
    fetchWishlistDetails();
  }, [wishlistIds]);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const availableSurveys = surveys.filter(s => !answeredSurveyIds.includes(s.id));

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" /> Pending</span>;
      case 'PAID':
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Paid</span>;
      case 'COMPLETED':
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3" /> Success</span>;
      case 'CANCELLED':
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3" /> Cancel</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { id: 'settings', label: 'Profile Settings', icon: Settings, color: 'text-blue-600', bg: 'bg-blue-50' },
    ...(availableSurveys.length > 0 ? [{ id: 'survey', label: 'Survei', icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50', badge: `${availableSurveys.length}` }] : []),
    { id: 'orders', label: 'Order History', icon: History, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'affiliate', label: 'Affiliate Center', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'about', label: 'Tentang Kita', icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  const renderMobileView = () => {
    const activeItem = menuItems.find(item => item.id === activeMobileView);
    
    return (
      <div className="fixed inset-0 z-[110] bg-surface flex flex-col md:hidden">
        <div className="bg-white px-4 py-4 border-b border-border flex items-center gap-4 sticky top-0">
          <button onClick={() => setActiveMobileView(null)} className="p-1 hover:bg-surface-alt rounded-full">
            <ArrowLeft className="w-6 h-6 text-text-primary" />
          </button>
          <h2 className="text-lg font-bold text-text-primary">{activeItem?.label || 'Menu'}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {activeMobileView === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="font-bold text-text-primary mb-4">Informasi Akun</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Nama Lengkap</label>
                    <p className="text-text-primary font-medium">{user.displayName}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Email</label>
                    <p className="text-text-primary font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Member Sejak</label>
                    <p className="text-text-primary font-medium">{new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
              <Link to="/settings" className="block w-full py-4 bg-primary text-white text-center font-bold rounded-2xl shadow-lg shadow-primary/20 no-underline">
                Edit Profil
              </Link>
            </div>
          )}

          {activeMobileView === 'survey' && (
            <div className="space-y-6">
              {availableSurveys.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg">
                    <h3 className="text-lg font-bold mb-2">Bantu Kami Berkembang</h3>
                    <p className="text-indigo-100 text-sm">Suara Anda sangat berarti bagi kami. Luangkan waktu sejenak untuk mengisi survei singkat ini.</p>
                  </div>
                  {availableSurveys.map(survey => (
                    <button
                      key={survey.id}
                      onClick={() => setSelectedSurvey(survey)}
                      className="w-full flex items-center justify-between p-5 bg-white border border-border rounded-2xl text-left hover:bg-surface-alt transition-colors"
                    >
                      <div>
                        <div className="font-bold text-text-primary">{survey.title}</div>
                        <div className="text-xs text-text-secondary">{survey.questions.length} Pertanyaan</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-muted" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-border shadow-sm text-center">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-text-primary mb-2">Terima Kasih!</h3>
                  <p className="text-text-secondary text-sm">Anda telah menyelesaikan semua survei yang tersedia. Masukan Anda sangat berharga bagi kami.</p>
                </div>
              )}
            </div>
          )}

          {activeMobileView === 'orders' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-border">
                  <History className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">Belum ada riwayat pemesanan</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="bg-white p-4 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-text-muted mb-1">Order ID: {booking.id.substring(0, 8)}</p>
                        <h4 className="font-bold text-text-primary">{booking.propertyName} {booking.unitName ? `(${booking.unitName})` : ''}</h4>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <p className="text-sm font-bold text-primary">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                      <button 
                        onClick={() => setSelectedBooking(booking)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeMobileView === 'wishlist' && (
            <div className="space-y-4">
              {wishlistProperties.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-border">
                  <Heart className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-text-secondary mb-4">Wishlist Anda masih kosong</p>
                  <button 
                    onClick={() => {
                      setActiveMobileView(null);
                      navigate('/explore');
                    }}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-xl"
                  >
                    Cari Properti
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {wishlistProperties.map(property => (
                    <div key={property.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex">
                      <img 
                        src={property.images[0]} 
                        alt={property.name} 
                        className="w-24 h-24 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-text-primary text-sm line-clamp-1">{property.name}</h4>
                          <p className="text-xs text-text-muted flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {property.location}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-primary">Rp {property.basePrice.toLocaleString('id-ID')}</p>
                          <button 
                            onClick={() => navigate(`/properties/${property.id}`)}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMobileView === 'affiliate' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm text-center">
                <TrendingUp className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-2">Program Affiliate</h3>
                <p className="text-text-secondary text-sm mb-6">Dapatkan komisi dengan mengajak teman menginap di Sikunir Vibes.</p>
                <button 
                  onClick={() => navigate('/affiliate')}
                  className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-100"
                >
                  Buka Affiliate Center
                </button>
              </div>
            </div>
          )}

          {activeMobileView === 'about' && (
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-text-primary">Tentang Sikunir Vibes</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Sikunir Vibes adalah platform penyedia layanan penginapan dan paket wisata terbaik di kawasan Dieng, khususnya area Sikunir. Kami berkomitmen memberikan pengalaman menginap yang tak terlupakan dengan pemandangan Golden Sunrise terbaik.
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-text-muted">Versi Aplikasi 2.1.0</p>
                <p className="text-xs text-text-muted mt-1">&copy; 2024 Sikunir Vibes. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:py-12">
      <Helmet>
        <title>Profil Saya | BromoStay</title>
      </Helmet>

      {activeMobileView && renderMobileView()}

      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || ''} 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-indigo-50 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold">
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md border border-border">
                <Settings className="w-4 h-4 text-text-secondary" />
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-1">{user.displayName}</h1>
              <p className="text-text-secondary mb-4">{user.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                  {user.role || 'Member'}
                </span>
                <span className="px-3 py-1 bg-surface-alt text-text-secondary rounded-full text-xs font-bold">
                  ID: {user.uid.substring(0, 8)}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-danger/10 text-danger font-bold rounded-2xl hover:bg-danger/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden space-y-2">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest px-2 mb-3">Menu Utama</h3>
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            {menuItems.map((item, idx) => (
              <button 
                key={item.id}
                onClick={() => setActiveMobileView(item.id)}
                className={`w-full flex items-center justify-between p-5 hover:bg-surface-alt transition-colors ${idx !== menuItems.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 ${item.bg} ${item.color} rounded-xl`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-text-primary">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-5 bg-red-50 text-red-600 font-bold rounded-3xl mt-4 border border-red-100"
          >
            <div className="p-2.5 bg-red-100 rounded-xl">
              <LogOut className="w-5 h-5" />
            </div>
            Keluar dari Akun
          </button>
        </div>

        {/* Desktop Content */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {/* Left Column - Stats & Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Pengaturan Akun
              </h3>
              <div className="space-y-4">
                <Link to="/settings" className="block w-full text-left p-3 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-text-secondary no-underline">
                  Edit Profil
                </Link>
                <button className="w-full text-left p-3 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-text-secondary">
                  Ubah Kata Sandi
                </button>
                <button className="w-full text-left p-3 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-text-secondary">
                  Notifikasi
                </button>
              </div>
            </div>

            {availableSurveys.length > 0 && (
              <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
                <ClipboardList className="w-10 h-10 mb-4" />
                <h3 className="text-lg font-bold mb-2">Selesaikan Survei</h3>
                <p className="text-indigo-100 text-sm mb-6">Bantu kami memberikan layanan terbaik untuk Anda.</p>
                <div className="space-y-2">
                  {availableSurveys.map(survey => (
                    <button 
                      key={survey.id}
                      onClick={() => setSelectedSurvey(survey)}
                      className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors text-sm"
                    >
                      {survey.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Bookings */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Riwayat Pemesanan
                </h3>
                <button className="text-sm font-bold text-primary hover:underline">Lihat Semua</button>
              </div>
              
              <div className="divide-y divide-border">
                {bookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <History className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-secondary">Belum ada riwayat pemesanan</p>
                    <button 
                      onClick={() => navigate('/explore')}
                      className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-xl"
                    >
                      Cari Penginapan
                    </button>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div key={booking.id} className="p-6 hover:bg-surface-alt transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-text-muted mb-1 font-mono uppercase">Order ID: {booking.id.substring(0, 8)}</p>
                          <h4 className="text-lg font-bold text-text-primary">{booking.propertyName} {booking.unitName ? `(${booking.unitName})` : ''}</h4>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {booking.checkInDate}
                          </div>
                          <span>&bull;</span>
                          <p>{booking.guests} Tamu</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-text-primary">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}

      {selectedSurvey && (
        <SurveyModal
          survey={selectedSurvey}
          userId={user.uid}
          onClose={() => setSelectedSurvey(null)}
          onSuccess={() => {
            setAnsweredSurveyIds(prev => [...prev, selectedSurvey.id]);
            setSelectedSurvey(null);
          }}
        />
      )}
    </div>
  );
}
