import React, { useState, useEffect, useRef } from 'react';
import { Property, Category, Promo, Jeep, TourPackage, Attraction } from '../../types';
import { getActiveProperties } from '../../services/firebase/properties';
import { getCategories } from '../../services/firebase/categories';
import { getPromos } from '../../services/firebase/promos';
import { getBlogs, Blog } from '../../services/firebase/blogs';
import { getJeeps } from '../../services/firebase/jeeps';
import { getTourPackages } from '../../services/firebase/tourPackages';
import { getAttractions } from '../../services/firebase/attractions';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { SEO } from '../../components/common/SEO';
import { HomePopup } from '../../components/common/HomePopup';
import { PropertyCard } from '../../components/property/PropertyCard';
import { JeepCard } from '../../components/jeep/JeepCard';
import { QnASection } from '../../components/common/QnASection';
import { Search, ChevronRight, Home as HomeIcon, Tag, CheckCircle, Car, Share2, HelpCircle, MapPin, Compass, ArrowRight, Bell, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { subscribeToUserNotifications, markNotificationAsRead, Notification } from '../../services/firebase/notifications';

export function Home() {
  const { user } = useAuthStore();
  const { 
    properties, propertiesWithPromos, categories, promos, blogs, jeeps, tourPackages, attractions, settings, isDataReady,
    setData, setDataReady 
  } = useDataStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(!isDataReady);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUserNotifications(user.uid, (data) => {
        setNotifications(data);
      });
      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (isDataReady) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [propsData, catsData, promosData, blogsData, jeepsData, tourPackagesData, attractionsData, settingsData] = await Promise.all([
          getActiveProperties(),
          getCategories(),
          getPromos(),
          getBlogs(),
          getJeeps(),
          getTourPackages(true),
          getAttractions(true),
          getSiteSettings()
        ]);
        
        // Sort promos by highest discount amount
        const activePromos = promosData.filter(p => p.isActive);
        const sortedPromos = [...activePromos].sort((a, b) => b.discountAmount - a.discountAmount);
        
        // Calculate properties with highest promo nominal
        const propsWithPromos = propsData.map(prop => {
          let maxDiscountNominal = 0;
          activePromos.forEach(promo => {
            if (!promo.applicableProperties || promo.applicableProperties.length === 0 || promo.applicableProperties.includes(prop.id)) {
              let discountNominal = 0;
              if (promo.discountType === 'percentage') {
                discountNominal = prop.basePrice * (promo.discountAmount / 100);
              } else {
                discountNominal = promo.discountAmount;
              }
              if (discountNominal > maxDiscountNominal) {
                maxDiscountNominal = discountNominal;
              }
            }
          });
          return { ...prop, maxDiscountNominal };
        }).filter(p => p.maxDiscountNominal > 0)
          .sort((a, b) => b.maxDiscountNominal - a.maxDiscountNominal)
          .slice(0, 5);

        setData({
          properties: propsData,
          categories: catsData.filter(c => c.isActive),
          promos: sortedPromos,
          propertiesWithPromos: propsWithPromos,
          blogs: blogsData.filter(b => b.isActive).slice(0, 3),
          jeeps: jeepsData.slice(0, 4),
          tourPackages: tourPackagesData.slice(0, 4),
          attractions: attractionsData.slice(0, 4),
          settings: settingsData,
          isDataReady: true
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isDataReady, setData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div className="pb-10 relative">
      <SEO 
        title={settings?.siteName || 'Sikunir Vibes - Penginapan Terbaik di Dieng'} 
        description={settings?.siteDescription || 'Temukan penginapan terbaik dan nyaman di Dieng dengan Sikunir Vibes. Nikmati pemandangan alam yang indah dan fasilitas lengkap.'}
        image={settings?.heroBannerUrl}
      />
      
      {settings?.homePopup && (
        <HomePopup settings={settings.homePopup} />
      )}

      {/* ========== STICKY TOP BAR ========== */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-all duration-300 transform ${
          isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-[18px] font-extrabold text-indigo-600 tracking-[-0.5px]">
                Sikunir <span className="text-orange-500">Vibes</span>
              </span>
            )}
          </Link>

          <form onSubmit={handleSearch} className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Cari penginapan..." 
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div className="flex items-center gap-1 relative">
            {user && (
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-white">
                    </span>
                  )}
                </button>

                {/* Mobile Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                      <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <Bell className="w-6 h-6 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Belum ada notifikasi</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                <div>
                                  <p className={`text-sm ${!notification.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-2">
                                    {notification.createdAt?.toDate ? new Date(notification.createdAt.toDate()).toLocaleString('id-ID', {
                                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    }) : 'Baru saja'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <Link to="/promos" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Tag className="w-5 h-5" />
              {promos.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ========== HERO ========== */}
      <section 
        className="pt-12 px-5 md:px-5 pb-[100px] relative overflow-hidden md:pt-[60px] md:pb-[120px] bg-cover bg-center rounded-b-[30px] md:rounded-b-[40px]"
        style={{ 
          backgroundColor: settings?.primaryColor || '#1a56db',
          ...(settings?.heroBannerUrl ? { backgroundImage: `linear-gradient(to bottom right, rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url(${settings.heroBannerUrl})` } : {})
        }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="flex justify-between items-start relative z-10 max-w-7xl mx-auto px-5 md:px-0">
          <div>
            <h1 className="text-white text-xl font-medium mb-1">
              Hello, {user?.displayName?.split(' ')[0] || 'Guest'}!
            </h1>
            <h2 className="text-white text-2xl font-bold">
              Let's Start Exploring 
            </h2>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold">
                {user?.displayName?.charAt(0) || 'G'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========== SEARCH BOX ========== */}
      <div className="px-5 md:px-5 -mt-[40px] relative z-20 max-w-3xl mx-auto mb-8 flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 bg-white rounded-full p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center">
          <div className="pl-4 pr-2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="Cari penginapan..." 
            className="flex-1 py-3 outline-none text-gray-700 bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="px-6 py-3 text-white rounded-full text-[15px] font-bold transition-all hover:opacity-90 active:scale-[0.98] mr-2 md:mr-0" style={{ backgroundColor: settings?.primaryColor || '#1a56db' }}>
            Cari
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto mt-4">
        {/* ========== KATEGORI ========== */}
        <section className="px-5 md:px-5 mb-12">
          <div className="flex items-center justify-between mb-6 md:px-0">
            <h2 className="text-lg font-bold text-gray-900">
              Kategori Pilihan
            </h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6 px-0">
            {categories.map(category => (
              <Link 
                key={category.id}
                to={`/category/${category.slug}`}
                className="flex flex-col items-center gap-2 group no-underline"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-700 transition-transform group-hover:scale-110 group-hover:bg-gray-100 border border-gray-100 overflow-hidden">
                  {category.iconUrl ? (
                    <img src={category.iconUrl} alt={category.name} className="w-full h-full object-cover p-2" referrerPolicy="no-referrer" loading="lazy" />
                  ) : category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  ) : (
                    <HomeIcon className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center line-clamp-1">{category.name}</span>
              </Link>
            ))}

            <Link 
              to="/jeeps"
              className="flex flex-col items-center gap-2 group no-underline"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110 group-hover:bg-amber-100 overflow-hidden">
                {settings?.jeepCategoryIconUrl ? (
                  <img src={settings.jeepCategoryIconUrl} alt="Jeep" className="w-full h-full object-cover p-2" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  <Car className="w-6 h-6" />
                )}
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">Jeep</span>
            </Link>
          </div>
        </section>

        {/* ========== PROMO BANNERS ========== */}
        {promos.length > 0 && (
          <section className="px-5 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Promo Spesial
              </h2>
              <Link to="/promos" className="text-sm font-medium text-gray-500 hover:text-gray-900 no-underline">
                Lihat Semua
              </Link>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-6 hide-scrollbar snap-x snap-mandatory px-5">
              {promos.map((promo) => (
                <Link 
                  key={promo.id} 
                  to="/promos"
                  className="min-w-[280px] sm:min-w-[320px] h-40 sm:h-48 rounded-2xl overflow-hidden relative group snap-start block no-underline"
                >
                  <img 
                    src={promo.imageUrl || 'https://picsum.photos/seed/promo/600/300'} 
                    alt={promo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {promo.code}
                      </span>
                      {promo.label && (
                        <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded">
                          {promo.label}
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1">{promo.title}</h3>
                    <p className="text-white/80 text-xs line-clamp-1 mt-0.5">{promo.description}</p>
                  </div>
                </Link>
              ))}
              <div className="w-5 shrink-0"></div>
            </div>
          </section>
        )}

        {/* ========== PROMO FOR YOU ========== */}
        {propertiesWithPromos.length > 0 && (
          <section className="px-5 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Promo For You!
              </h2>
              <Link to="/explore" className="text-sm font-medium text-gray-500 hover:text-gray-900 no-underline">
                See all
              </Link>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-6 hide-scrollbar snap-x snap-mandatory px-5">
              {propertiesWithPromos.map((property) => {
                const category = categories.find(c => c.id === property.categoryId);
                return (
                  <div key={property.id} className="min-w-[260px] sm:min-w-[300px] snap-start">
                    <PropertyCard 
                      property={property} 
                      categoryName={category?.name}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========== RECOMMENDED FOR YOU ========== */}
        <section className="px-5 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Recommended For You!
            </h2>
            <Link to="/explore" className="text-sm font-medium text-gray-500 hover:text-gray-900 no-underline">
              See all
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-6 hide-scrollbar snap-x snap-mandatory px-5">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100 p-3 min-w-[260px] sm:min-w-0 snap-start">
                  <div className="h-48 bg-gray-200 rounded-xl mb-3"></div>
                  <div className="space-y-3 px-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/3 mt-4"></div>
                  </div>
                </div>
              ))
            ) : (
              properties.map(property => {
                const category = categories.find(c => c.id === property.categoryId);
                return (
                  <div key={property.id} className="min-w-[260px] sm:min-w-[300px] snap-start">
                    <PropertyCard 
                      property={property} 
                      categoryName={category?.name}
                    />
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ========== LIST WISATA ========== */}
        {attractions.length > 0 && (
          <section className="px-5 mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Destinasi Wisata
                </h2>
              </div>
              <Link to="/attractions" className="text-sm font-medium text-blue-600 hover:underline no-underline flex items-center gap-1">
                Lihat semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-6 hide-scrollbar snap-x snap-mandatory px-5 -mx-5">
              {attractions.map(attraction => (
                <Link to={`/attractions/${attraction.id}`} key={attraction.id} className="min-w-[220px] sm:min-w-[260px] snap-start no-underline group">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-lg transition-all duration-300">
                    <img 
                      src={attraction.images?.[0] || 'https://images.unsplash.com/photo-1506744626753-eba7bc20d5ad?auto=format&fit=crop&q=80&w=600'} 
                      alt={attraction.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-base leading-tight mb-1 group-hover:text-amber-300 transition-colors">{attraction.name}</h3>
                      <p className="text-white/70 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {attraction.location}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ========== TOUR PACKAGES ========== */}
        {tourPackages.length > 0 && (
          <section className="px-5 mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <Compass className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Paket Wisata Populer
                </h2>
              </div>
              <Link to="/explore?type=tour" className="text-sm font-medium text-blue-600 hover:underline no-underline flex items-center gap-1">
                Lihat semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-5 pb-6 hide-scrollbar snap-x snap-mandatory px-5 -mx-5">
              {tourPackages.map(pkg => (
                <Link 
                  key={pkg.id} 
                  to={`/tour-packages/${pkg.id}`}
                  className="min-w-[280px] max-w-[320px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 snap-start no-underline group flex flex-col hover:shadow-md transition-all duration-300"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img 
                      src={pkg.images[0] || 'https://via.placeholder.com/400x300'} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        DISKON
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{pkg.name}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-3 flex-1">{pkg.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {pkg.includedServices.slice(0, 3).map((service, i) => (
                        <span key={i} className="text-[9px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                          {service}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-end justify-between pt-3 border-t border-gray-50">
                      <div>
                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <div className="text-[10px] text-gray-400 line-through mb-0.5">
                            Rp {pkg.originalPrice.toLocaleString('id-ID')}
                          </div>
                        )}
                        <div className="text-sm font-bold text-indigo-600">
                          Rp {pkg.price.toLocaleString('id-ID')}
                          <span className="text-[10px] text-gray-400 font-normal ml-1">/pax</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                        Detail
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ========== JEEP RENTAL ========== */}
        <section className="px-5 mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <Car className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Sewa Jeep Dieng
              </h2>
            </div>
            <Link to="/jeeps" className="text-sm font-medium text-gray-500 hover:text-gray-900 no-underline">
              Lihat semua
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-6 hide-scrollbar snap-x snap-mandatory px-5">
            {loading ? (
              [1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100 p-3 min-w-[260px] snap-start">
                  <div className="h-40 bg-gray-200 rounded-xl mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              jeeps.map(jeep => (
                <div key={jeep.id} className="min-w-[280px] max-w-[320px] snap-start">
                  <JeepCard jeep={jeep} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* ========== LATEST BLOGS ========== */}
        <section className="px-5 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Berita & Informasi Dieng
            </h2>
            <Link to="/blogs" className="text-sm font-medium text-gray-500 hover:text-gray-900 no-underline">
              Lihat semua
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100 p-3">
                  <div className="h-32 bg-gray-200 rounded-xl mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              blogs.map(blog => (
                <div key={blog.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 p-3">
                  <Link to={`/blogs/${blog.slug}`} className="no-underline block">
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 mb-3">
                      <img 
                        src={blog.imageUrl || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80'} 
                        alt={blog.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                  <div className="px-1 flex flex-col flex-grow">
                    <Link to={`/blogs/${blog.slug}`} className="no-underline block">
                      <h3 className="text-[15px] font-bold text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                        {blog.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </Link>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="text-[12px] text-gray-500 font-medium">
                        {new Date(blog.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          if (navigator.share) {
                            navigator.share({
                              title: blog.title,
                              url: `${window.location.origin}/blogs/${blog.slug}`
                            }).catch(console.error);
                          } else {
                            navigator.clipboard.writeText(`${window.location.origin}/blogs/${blog.slug}`);
                            alert('Link disalin ke clipboard!');
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Bagikan"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ========== Q&A SECTION ========== */}
        {settings?.qna && settings.qna.length > 0 && (
          <section className="px-5 mb-24">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <QnASection qnaList={settings.qna} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
