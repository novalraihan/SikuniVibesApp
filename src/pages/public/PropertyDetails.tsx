import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Star, MapPin, Heart, ArrowLeft, Share2, Bed, Bath, Users, MessageCircle, Phone, Calendar as CalendarIcon, Car, ChevronRight, Map as MapIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Property, Amenity, Promo, Attraction } from '../../types';
import { getProperty, getActiveProperties } from '../../services/firebase/properties';
import { getAllAmenities } from '../../services/firebase/amenities';
import { getCategory } from '../../services/firebase/categories';
import { getPromos } from '../../services/firebase/promos';
import { getAttractions } from '../../services/firebase/attractions';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { ReviewsSection } from '../../components/property/ReviewsSection';
import { BookingCalendar } from '../../components/property/BookingCalendar';
import { PropertyCard } from '../../components/property/PropertyCard';
import { QnASection } from '../../components/common/QnASection';
import { SEO } from '../../components/common/SEO';
import { toast } from 'sonner';

export function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tourPackageId = searchParams.get('tourPackageId');
  const { user } = useAuthStore();
  const { wishlistIds, toggleItem } = useWishlistStore();
  const datePickerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const [property, setProperty] = useState<Property | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [activePromos, setActivePromos] = useState<Promo[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [readMore, setReadMore] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Date selection state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | null>(null);

  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const getDatesInRange = (startDate: string, endDate: string) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    while (currentDate < end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const isUnitAvailable = (unitIndex: number) => {
    if (!checkIn || !checkOut) return true;
    const unitDates = property?.unitBookedDates?.[unitIndex] || [];
    const selectedDates = getDatesInRange(checkIn, checkOut);
    return !selectedDates.some(date => unitDates.includes(date));
  };

  useEffect(() => {
    if (selectedUnitIndex !== null && !isUnitAvailable(selectedUnitIndex)) {
      setSelectedUnitIndex(null);
    }
  }, [checkIn, checkOut, property, selectedUnitIndex]);

  const fetchData = async (propertyId: string) => {
    try {
      setLoading(true);
      const [propData, amenitiesData, settingsData, activeProps, promosData, attractionsData] = await Promise.all([
        getProperty(propertyId),
        getAllAmenities(),
        getSiteSettings(),
        getActiveProperties(),
        getPromos(true),
        getAttractions()
      ]);
      setProperty(propData);
      setAllAmenities(amenitiesData);
      setSiteSettings(settingsData);
      setAttractions(attractionsData);
      
      // Filter promos for this property
      const propertyPromos = promosData.filter(p => 
        !p.applicableProperties || 
        p.applicableProperties.length === 0 || 
        p.applicableProperties.includes(propertyId)
      );
      setActivePromos(propertyPromos);
      
      if (propData?.categoryId) {
        const catData = await getCategory(propData.categoryId);
        if (catData) setCategoryName(catData.name);
      }

      // Get 3 random recommended properties excluding current one
      const others = activeProps.filter(p => p.id !== propertyId);
      const shuffled = others.sort(() => 0.5 - Math.random());
      setRecommendedProperties(shuffled.slice(0, 3));

    } catch (error) {
      console.error("Error fetching property data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageScroll = (index: number) => {
    setCurrentImageIndex(index);
    if (imageContainerRef.current) {
      const container = imageContainerRef.current;
      const imageWidth = container.offsetWidth;
      container.scrollTo({
        left: index * imageWidth,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property || !property.isActive) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Properti tidak ditemukan</h2>
        <p className="text-gray-500 mb-6 text-sm">Properti yang Anda cari mungkin sudah dihapus atau tidak aktif.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 font-medium hover:underline text-sm">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isWishlisted = wishlistIds.includes(property.id);

  const handleWishlistClick = () => {
    toggleItem(user?.uid, property.id);
  };

  const handleBooking = () => {
    if (!checkIn || !checkOut) {
      datePickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (property?.units && property.units.length > 0 && selectedUnitIndex === null) {
      toast.error('Pilih tipe unit terlebih dahulu');
      return;
    }
    const checkoutUrl = `/checkout/${property?.id}?checkIn=${checkIn}&checkOut=${checkOut}${tourPackageId ? `&tourPackageId=${tourPackageId}` : ''}${selectedUnitIndex !== null ? `&unitIndex=${selectedUnitIndex}` : ''}`;
    navigate(checkoutUrl);
  };

  const handleWhatsApp = () => {
    const phoneNumber = siteSettings?.contactPhone || '6281234567890';
    const message = `Halo, saya tertarik dengan properti ${property.name} yang ada di aplikasi.`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleGoogleMaps = () => {
    if (property.coordinates?.lat && property.coordinates?.lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${property.coordinates.lat},${property.coordinates.lng}`, '_blank');
    }
  };

  const handleShare = async () => {
    let shareUrl = window.location.href;
    if (user?.affiliateStatus === 'approved' && user?.affiliateCode) {
      const urlObj = new URL(shareUrl);
      urlObj.searchParams.set('ref', user.affiliateCode);
      shareUrl = urlObj.toString();
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.name,
          text: `Lihat penginapan ${property.name} di Sikunir Vibes!`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link disalin ke clipboard!');
    }
  };

  const handleJeepRental = () => {
    const event = new CustomEvent('openChatbot', { 
      detail: { message: `Halo, saya ingin menyewa Jeep untuk kunjungan saya ke ${property?.name}.` } 
    });
    window.dispatchEvent(event);
  };

  const calculateTotalPrice = () => {
    if (!property) return 0;
    const basePrice = (property.units && property.units.length > 0 && selectedUnitIndex !== null) 
      ? property.units[selectedUnitIndex].price 
      : property.basePrice;

    if (!checkIn || !checkOut) return basePrice;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? basePrice * diffDays : basePrice;
  };

  const getBookedDates = () => {
    if (!property) return [];
    if (property.units && property.units.length > 0) {
      // If property has units, a date is fully booked only if ALL units are booked on that date
      const allDates = new Set<string>();
      const unitCount = property.units.length;
      const dateCounts: Record<string, number> = {};
      
      for (let i = 0; i < unitCount; i++) {
        const dates = property.unitBookedDates?.[i] || [];
        dates.forEach(date => {
          dateCounts[date] = (dateCounts[date] || 0) + 1;
          if (dateCounts[date] === unitCount) {
            allDates.add(date);
          }
        });
      }
      return Array.from(allDates);
    }
    return property.bookedDates || [];
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];
  // Min checkout is day after checkin, or tomorrow
  const minCheckOut = checkIn ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="bg-white min-h-screen pb-24 relative font-sans">
      <SEO 
        title={`${property.name} - Rp ${property.basePrice.toLocaleString('id-ID')}`} 
        description={`${property.location}. ${property.description.substring(0, 150)}...`}
        image={property.images[0]}
      />
      
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 flex justify-between px-4 py-4 z-50 bg-gradient-to-b from-black/50 to-transparent">
        <button 
          onClick={() => navigate(-1)}
          className="w-[38px] h-[38px] rounded-full bg-white/90 border-none flex items-center justify-center cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform active:scale-95"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-[#111]" strokeWidth={2.2} />
        </button>
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="w-[38px] h-[38px] rounded-full bg-white/90 border-none flex items-center justify-center cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform active:scale-95"
          >
            <Share2 className="w-[17px] h-[17px] text-[#111]" strokeWidth={2.2} />
          </button>
          <button 
            onClick={handleWishlistClick}
            className="w-[38px] h-[38px] rounded-full bg-white/90 border-none flex items-center justify-center cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform active:scale-95"
          >
            <Heart className={`w-[17px] h-[17px] ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#111]'}`} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* HERO - Sticky Banner */}
      <div className="sticky top-0 w-full h-[260px] md:h-[400px] bg-[#C9D4DC] overflow-hidden z-0">
        <div 
          ref={imageContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide"
          onScroll={(e) => {
            const container = e.currentTarget;
            const index = Math.round(container.scrollLeft / container.offsetWidth);
            if (index !== currentImageIndex) setCurrentImageIndex(index);
          }}
        >
          {property.images.length > 0 ? (
            property.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`${property.name} - ${idx + 1}`} 
                className="w-full h-full object-cover block shrink-0 snap-center cursor-pointer" 
                referrerPolicy="no-referrer" 
                loading="lazy" 
                onClick={() => setShowGallery(true)}
              />
            ))
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#D1D9E0] to-[#B8C4CC] flex items-center justify-center text-[80px] shrink-0 snap-center">
              🛏️
            </div>
          )}
        </div>

        {/* thumbnail strip */}
        <div className="absolute bottom-6 left-3 flex gap-1.5 z-20 pointer-events-auto">
          {property.images.slice(0, 3).map((img, idx) => (
            <button 
              key={idx} 
              onClick={(e) => {
                e.stopPropagation();
                handleImageScroll(idx);
              }}
              className={`w-[52px] h-[40px] rounded-lg border-2 overflow-hidden relative transition-all shadow-md ${
                idx === currentImageIndex ? 'border-blue-500 scale-110' : 'border-white/85'
              }`}
            >
              <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            </button>
          ))}
          {property.images.length > 3 && (
            <button 
              onClick={() => setShowGallery(true)}
              className="w-[52px] h-[40px] rounded-lg border-2 border-white/85 overflow-hidden relative"
            >
              <img src={property.images[3]} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[11px] font-bold tracking-wide">
                +{property.images.length - 3}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex justify-between items-center p-4">
            <button onClick={() => setShowGallery(false)} className="text-white p-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-white font-medium">Galeri Foto</div>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            {property.images.map((img, idx) => (
              <img key={idx} src={img} alt={`Gallery ${idx}`} className="w-full rounded-xl" referrerPolicy="no-referrer" loading="lazy" />
            ))}
          </div>
        </div>
      )}

      {/* CONTENT CARD */}
      <div className="bg-white rounded-t-[22px] -mt-[18px] relative z-[5] px-6 py-8 md:px-10 md:py-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        
        {/* title row */}
        <div className="flex items-start justify-between gap-2.5 mb-1.5">
          <h1 className="text-[22px] md:text-[28px] leading-[1.2] text-gray-900 flex-1 font-montserrat font-bold">
            {property.name}
          </h1>
          <button 
            onClick={handleGoogleMaps}
            className="w-[40px] h-[40px] rounded-full bg-blue-600 border-none flex items-center justify-center cursor-pointer shrink-0 mt-0.5 transition-colors hover:bg-blue-700"
          >
            <MapPin className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] md:text-[15px] color-gray-500 flex items-center gap-1 text-gray-500">
            <MapPin className="w-[13px] h-[13px] text-gray-400" />
            {property.location || 'Sikunir, Dieng, Wonosobo'}
          </p>
        </div>

        {/* badge + rating */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
            {categoryName || property.categoryId}
          </span>
          <div className="flex items-center gap-1 text-[13px] md:text-[15px] font-semibold text-gray-900">
            <Star className="w-[14px] h-[14px] text-amber-500 fill-amber-500" />
            {property.ratingAverage > 0 ? property.ratingAverage.toFixed(1) : 'New'}
            <span className="text-gray-500 font-normal">({property.reviewCount} reviews)</span>
          </div>
        </div>

        <div className="animate-[fadeUp_0.35s_ease_both]">
          {/* Features (Specs) */}
          <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-3">Features</div>
          <div className="flex gap-0 mb-6 bg-gray-50 rounded-[14px] p-4 md:p-6">
            <div className="flex-1 flex flex-col items-center gap-1.5 relative">
              <Bed className="w-[20px] h-[20px] text-blue-600" strokeWidth={1.8} />
              <span className="text-[13px] font-semibold text-gray-900">{property.bedrooms || 1} Beds</span>
              <span className="text-[11px] text-gray-400">Bedrooms</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 relative before:content-[''] before:absolute before:left-0 before:top-[10%] before:bottom-[10%] before:w-[1px] before:bg-gray-200">
              <Bath className="w-[20px] h-[20px] text-blue-600" strokeWidth={1.8} />
              <span className="text-[13px] font-semibold text-gray-900">{property.bathrooms || 1} Bath</span>
              <span className="text-[11px] text-gray-400">Bathroom</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 relative before:content-[''] before:absolute before:left-0 before:top-[10%] before:bottom-[10%] before:w-[1px] before:bg-gray-200">
              <Users className="w-[20px] h-[20px] text-blue-600" strokeWidth={1.8} />
              <span className="text-[13px] font-semibold text-gray-900">{property.maxGuests}</span>
              <span className="text-[11px] text-gray-400">Guests</span>
            </div>
          </div>

          {/* All Amenities List */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-6">
              <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-3">Facilitys</div>
              <div className="grid grid-cols-2 gap-4">
                {property.amenities.map(amenityName => {
                  const amenityData = allAmenities.find(a => a.name === amenityName);
                  const iconName = amenityData?.icon || 'CheckCircle2';
                  const IconComponent = (Icons as any)[iconName] || Icons.CheckCircle2;
                  
                  return (
                    <div key={amenityName} className="flex items-center gap-3 text-gray-700">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                      <span className="text-[15px] font-medium">{amenityName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Map Preview */}
          {property.coordinates?.lat && property.coordinates?.lng && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[16px] md:text-[18px] font-bold text-gray-900">Lokasi</div>
                <button 
                  onClick={() => navigate('/map')}
                  className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-full"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  Lihat Peta
                </button>
              </div>
              <div className="rounded-[14px] overflow-hidden border border-gray-200 mb-3 relative h-[180px] md:h-[250px]">
                <iframe 
                  src={`https://maps.google.com/maps?q=${property.coordinates.lat},${property.coordinates.lng}&z=15&output=embed`} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps Preview"
                ></iframe>
              </div>
              <button 
                onClick={handleGoogleMaps}
                className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Buka di Google Maps
              </button>
            </div>
          )}

          {/* Peraturan Akomodasi */}
          {property.accommodationRules && (
            <div className="mb-6">
              <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-3">Peraturan Akomodasi</div>
              <div className="bg-orange-50 rounded-[14px] p-4 md:p-6 border border-orange-100">
                <p className="text-[14px] md:text-[16px] leading-[1.65] text-orange-800 whitespace-pre-line">
                  {property.accommodationRules}
                </p>
              </div>
            </div>
          )}

          {/* Property Units */}
          {property.units && property.units.length > 0 && (
            <div className="mb-6">
              <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-3">Tipe Unit</div>
              <div className="space-y-3">
                {property.units.map((unit, idx) => {
                  const available = isUnitAvailable(idx);
                  return (
                  <div 
                    key={idx} 
                    onClick={() => available && setSelectedUnitIndex(idx)}
                    className={`p-4 rounded-2xl border transition-all ${!available ? 'opacity-50 bg-gray-100 cursor-not-allowed' : selectedUnitIndex === idx ? 'bg-blue-50 border-blue-500 shadow-sm cursor-pointer' : 'bg-gray-50 border-gray-100 hover:border-blue-200 cursor-pointer'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedUnitIndex === idx ? 'border-blue-600' : 'border-gray-300'}`}>
                          {selectedUnitIndex === idx && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                        </div>
                        <h4 className={`font-bold ${selectedUnitIndex === idx ? 'text-blue-900' : 'text-gray-900'}`}>{unit.name}</h4>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          Rp {unit.price?.toLocaleString('id-ID')}
                        </span>
                        {!available && <span className="text-[10px] text-red-500 mt-1 font-medium">Tidak tersedia</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 pl-6">{unit.description}</p>
                    <div className="flex gap-3 text-[11px] text-gray-400 pl-6">
                      <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {unit.capacity} Tamu</span>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* Nearby Attractions */}
          {property.nearbyAttractions && property.nearbyAttractions.length > 0 && (
            <div className="mb-6">
              <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-3">Wisata Terdekat</div>
              <div className="grid grid-cols-1 gap-3">
                {property.nearbyAttractions.map((na, idx) => {
                  const attraction = attractions.find(a => a.id === na.attractionId);
                  if (!attraction) return null;
                  return (
                    <Link 
                      key={idx} 
                      to={`/attractions/${attraction.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 no-underline group"
                    >
                      <img 
                        src={attraction.images[0] || 'https://via.placeholder.com/100'} 
                        alt={attraction.name} 
                        className="w-14 h-14 object-cover rounded-xl group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">{attraction.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{na.distance} km dari properti</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* description */}
          <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-3">Deskripsi</div>
          <p className="text-[14px] md:text-[16px] leading-[1.65] text-gray-600 mb-2 whitespace-pre-line">
            {readMore ? property.description : `${property.description.substring(0, 150)}${property.description.length > 150 ? '...' : ''}`}
          </p>
          {property.description.length > 150 && (
            <button 
              onClick={() => setReadMore(!readMore)} 
              className="text-[14px] text-blue-600 font-medium cursor-pointer bg-transparent border-none p-0 mb-6"
            >
              {readMore ? 'Read less' : 'Read more'}
            </button>
          )}

          {/* contact */}
          <div className="mt-6 mb-8">
            <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-3">Contact Details</div>
            <div className="flex items-center justify-between bg-gray-50 rounded-[14px] p-4 md:p-6 border border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-[16px] font-bold text-white shrink-0">
                  {siteSettings?.contactName ? siteSettings.contactName.substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-gray-900">{siteSettings?.contactName || 'Admin / Owner'}</div>
                  <div className="text-[12px] text-gray-500">Property Manager</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleWhatsApp} className="w-[36px] h-[36px] rounded-full border-[1.5px] border-gray-200 bg-white flex items-center justify-center cursor-pointer transition-colors hover:bg-green-50">
                  <MessageCircle className="w-[16px] h-[16px] text-green-600" strokeWidth={2} />
                </button>
                <button onClick={handleWhatsApp} className="w-[36px] h-[36px] rounded-full border-[1.5px] border-gray-200 bg-white flex items-center justify-center cursor-pointer transition-colors hover:bg-blue-50">
                  <Phone className="w-[16px] h-[16px] text-blue-600" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div ref={datePickerRef} className="mb-8 animate-[fadeUp_0.35s_ease_both]">
            <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-3">Pilih Tanggal Menginap</div>
            <BookingCalendar 
              bookedDates={getBookedDates()}
              checkIn={checkIn}
              checkOut={checkOut}
              onSelectCheckIn={setCheckIn}
              onSelectCheckOut={setCheckOut}
            />
          </div>

          {/* REVIEW panel */}
          <div className="border-t border-gray-100 pt-6">
            <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-4">Ulasan</div>
            <ReviewsSection 
              propertyId={property.id} 
              onReviewAdded={() => fetchData(property.id)} 
            />
          </div>

          {/* Q&A SECTION */}
          {siteSettings?.qna && siteSettings.qna.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <QnASection qnaList={siteSettings.qna} />
            </div>
          )}

          {/* RECOMMENDED PROPERTIES */}
          {recommendedProperties.length > 0 && (
            <div className="border-t border-gray-100 pt-6 pb-24">
              <div className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-4">Rekomendasi Penginapan Lain</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendedProperties.map(prop => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-6 inset-x-0 flex flex-col items-center z-50 px-6 animate-[slideUp_0.4s_ease-out_forwards]">
        {/* Promo Slider */}
        {activePromos.length > 0 && (
          <div className="w-full max-w-[342px] bg-amber-50 rounded-t-2xl border-x border-t border-amber-100 py-1.5 px-4 overflow-hidden">
            <div className="flex animate-[marquee_20s_linear_infinite] whitespace-nowrap gap-8">
              {activePromos.map(promo => (
                <span key={promo.id} className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  🔥 {promo.title}: Diskon {promo.discountType === 'percentage' ? `${promo.discountAmount}%` : `Rp ${promo.discountAmount.toLocaleString('id-ID')}`}! Gunakan kode: <span className="text-blue-600">{promo.code}</span>
                </span>
              ))}
              {/* Duplicate for seamless loop */}
              {activePromos.map(promo => (
                <span key={`${promo.id}-dup`} className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  🔥 {promo.title}: Diskon {promo.discountType === 'percentage' ? `${promo.discountAmount}%` : `Rp ${promo.discountAmount.toLocaleString('id-ID')}`}! Gunakan kode: <span className="text-blue-600">{promo.code}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={`w-full max-w-[342px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-4 py-2 flex items-center justify-between ${activePromos.length > 0 ? 'rounded-b-[30px] border-t border-gray-100' : 'rounded-full'}`}>
          <div className="leading-[1.2] pl-2 flex-1">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">Total Price</div>
            <div className="text-[16px] font-bold text-gray-900">
              Rp {calculateTotalPrice().toLocaleString('id-ID')}
              {!checkIn || !checkOut ? <span className="text-[10px] text-gray-500 font-normal">/night</span> : null}
            </div>
          </div>
          <button 
            onClick={handleBooking}
            className="px-6 py-2.5 bg-blue-600 text-white border-none rounded-full text-[13px] font-bold cursor-pointer transition-all hover:bg-blue-700 active:scale-95 font-sans shadow-[0_4px_12px_rgba(37,99,235,0.3)] flex items-center justify-center min-w-[120px] shrink-0"
          >
            Book Now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
