import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Property, Promo, AddOn, TourPackage } from '../../types';
import { BookingCalendar } from '../../components/property/BookingCalendar';
import { getProperty } from '../../services/firebase/properties';
import { getCategory } from '../../services/firebase/categories';
import { getPromos } from '../../services/firebase/promos';
import { getAddOns } from '../../services/firebase/addons';
import { getTourPackages } from '../../services/firebase/tourPackages';
import { createBooking, updateBookingStatus } from '../../services/firebase/bookings';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { ChevronRight, Info, Plus, Minus, Tag, Image as ImageIcon, Package } from 'lucide-react';

import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';

export const Checkout: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | null>(searchParams.get('unitIndex') ? parseInt(searchParams.get('unitIndex')!) : null);
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentType, setPaymentType] = useState<'full' | 'dp'>('full');
  
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [availablePromos, setAvailablePromos] = useState<Promo[]>([]);
  const [showPromoList, setShowPromoList] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<{[key: string]: number}>({});
  const [showAddOnDetails, setShowAddOnDetails] = useState<string | null>(null);

  const [tourPackages, setTourPackages] = useState<TourPackage[]>([]);
  const [selectedTourPackageId, setSelectedTourPackageId] = useState<string | null>(searchParams.get('tourPackageId') || null);
  const [showTourPackageDetails, setShowTourPackageDetails] = useState<string | null>(null);
  const [isTourPackagesVisible, setIsTourPackagesVisible] = useState(false);
  const [isAddOnsVisible, setIsAddOnsVisible] = useState(false);
  
  const [showPromoDetails, setShowPromoDetails] = useState<string | null>(null);
  
  const calendarRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const [propData, promosData, addOnsData, tourPackagesData, settingsData] = await Promise.all([
            getProperty(id),
            getPromos(true),
            getAddOns(true),
            getTourPackages(true),
            getSiteSettings()
          ]);
          setProperty(propData);
          setAddOns(addOnsData);
          setSiteSettings(settingsData);
          
          if (propData) {
            const categoryData = await getCategory(propData.categoryId);
            if (categoryData) {
              setCategorySlug(categoryData.slug);
            }
            const applicablePromos = promosData.filter(p => 
              (!p.applicableProperties || p.applicableProperties.length === 0 || p.applicableProperties.includes(id)) &&
              p.isActive
            );
            setAvailablePromos(applicablePromos);

            const applicableTourPackages = tourPackagesData.filter(tp => 
              (!tp.propertyIds || tp.propertyIds.length === 0 || tp.propertyIds.includes(id)) &&
              tp.isActive
            );
            setTourPackages(applicableTourPackages);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  const handleApplyVoucher = (code?: string) => {
    setVoucherError('');
    const codeToApply = code || voucherCode;
    
    if (!codeToApply.trim()) {
      setAppliedPromo(null);
      setSelectedPromoId(null);
      return;
    }

    const promo = availablePromos.find(p => p.code.toLowerCase() === codeToApply.trim().toLowerCase());
    if (promo) {
      setAppliedPromo(promo);
      setSelectedPromoId(promo.id);
      setVoucherCode(promo.code);
      setShowPromoList(false);
    } else {
      setVoucherError('Kode voucher tidak valid atau tidak berlaku untuk properti ini.');
      setAppliedPromo(null);
      setSelectedPromoId(null);
    }
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => {
      const current = prev[addOnId] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[addOnId];
        return next;
      } else {
        return { ...prev, [addOnId]: 1 };
      }
    });
  };

  const updateAddOnQuantity = (addOnId: string, delta: number) => {
    setSelectedAddOns(prev => {
      const current = prev[addOnId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const newState = { ...prev };
        delete newState[addOnId];
        return newState;
      }
      return { ...prev, [addOnId]: next };
    });
  };
  
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

  const nights = checkIn && checkOut ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))) : 0;
  
  const basePricePerNight = property ? (property.units && property.units.length > 0 && selectedUnitIndex !== null ? property.units[selectedUnitIndex].price : property.basePrice) : 0;
  const discountPerNight = appliedPromo ? (appliedPromo.discountType === 'percentage' ? basePricePerNight * (appliedPromo.discountAmount / 100) : appliedPromo.discountAmount) : 0;
  const finalPricePerNight = Math.max(0, basePricePerNight - discountPerNight);
  
  const addOnsTotal = Object.entries(selectedAddOns).reduce((total, [id, qty]) => {
    const addOn = addOns.find(a => a.id === id);
    return total + (addOn ? addOn.price * qty : 0);
  }, 0);

  const tourPackageTotal = selectedTourPackageId 
    ? (tourPackages.find(tp => tp.id === selectedTourPackageId)?.price || 0) 
    : 0;

  const totalPrice = (nights * finalPricePerNight) + addOnsTotal + tourPackageTotal;
  
  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];
  // Min checkout is day after checkin, or tomorrow
  const minCheckOut = checkIn ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Silakan pilih tanggal check-in dan check-out.');
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (nights <= 0) {
      toast.error('Tanggal check-out harus setelah check-in.');
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    if (!user) {
      if (!guestName || !guestEmail || !guestPhone) {
        toast.error('Silakan lengkapi data diri Anda.');
        return;
      }
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        toast.error('Format email tidak valid.');
        return;
      }
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const bookedDateStrings = getDatesInRange(checkIn, checkOut);
      
      let hasOverlap = false;
      if (selectedUnitIndex !== null && property?.unitBookedDates) {
        const unitDates = property.unitBookedDates[selectedUnitIndex] || [];
        hasOverlap = bookedDateStrings.some(date => unitDates.includes(date));
      } else if (property?.bookedDates) {
        hasOverlap = property.bookedDates.some(date => bookedDateStrings.includes(date));
      }

      if (hasOverlap) {
        toast.error('Maaf, beberapa tanggal yang Anda pilih sudah dibooking oleh orang lain.');
        throw new Error('Maaf, beberapa tanggal yang Anda pilih sudah dibooking oleh orang lain.');
      }
      
      // 1. Create booking in Firestore (PENDING)
      const amountToPay = paymentType === 'dp' ? totalPrice / 2 : totalPrice;
      
      const bookingData: any = {
        propertyId: property!.id,
        unitIndex: selectedUnitIndex,
        unitName: property!.units && property!.units.length > 0 && selectedUnitIndex !== null ? property!.units[selectedUnitIndex].name : undefined,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalAmount: totalPrice,
        paymentType: paymentType,
        dpAmount: paymentType === 'dp' ? amountToPay : undefined,
        voucherCode: appliedPromo ? appliedPromo.code : undefined,
        discountAmount: discountPerNight * nights,
        tourPackageId: selectedTourPackageId || undefined,
        addOns: Object.entries(selectedAddOns).map(([id, qty]) => ({
          addOnId: id,
          quantity: qty,
          price: addOns.find(a => a.id === id)?.price || 0
        })),
        updatedAt: Date.now(),
      };

      if (user) {
        bookingData.userId = user.uid;
      } else {
        bookingData.guestName = guestName;
        bookingData.guestEmail = guestEmail;
        bookingData.guestPhone = guestPhone;
      }

      // Check for affiliate ref
      const affiliateRef = localStorage.getItem('affiliateRef');
      if (affiliateRef && (!user || user.affiliateCode !== affiliateRef)) {
        // Find affiliate user by code
        try {
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('../../config/firebase');
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('affiliateCode', '==', affiliateRef), where('affiliateStatus', '==', 'approved'));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const affiliateDoc = snapshot.docs[0];
            // Prevent user from being their own affiliate
            if (!user || affiliateDoc.id !== user.uid) {
              bookingData.affiliateId = affiliateDoc.id;
              // Calculate commission (use property specific amount if available, otherwise 5% of total)
              if (property?.affiliateCommission) {
                bookingData.commissionAmount = property.affiliateCommission;
              } else {
                bookingData.commissionAmount = Math.floor(totalPrice * 0.05);
              }
              bookingData.commissionStatus = 'pending';
            }
          }
        } catch (err) {
          console.error('Error checking affiliate:', err);
        }
      }

      const bookingId = await createBooking(bookingData, bookedDateStrings);
      
      // Cache booking for non-logged in users
      if (!user) {
        const cachedBookings = JSON.parse(localStorage.getItem('guestBookings') || '[]');
        cachedBookings.push({
          id: bookingId,
          propertyName: property?.name,
          checkIn: checkIn,
          checkOut: checkOut,
          totalPrice,
          paymentType,
          amountToPay,
          contact: guestEmail || guestPhone,
          createdAt: Date.now()
        });
        localStorage.setItem('guestBookings', JSON.stringify(cachedBookings));
      }

      // 2. Get Midtrans Snap Token from backend
      const response = await fetch('/api/payment/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount: amountToPay,
          customerDetails: {
            first_name: user ? user.displayName : guestName,
            email: user ? user.email : guestEmail,
            phone: user ? user.phoneNumber || '' : guestPhone,
          },
          itemDetails: [{
            id: property!.id,
            price: amountToPay,
            quantity: 1,
            name: `${property!.name.substring(0, 30)} - ${paymentType === 'dp' ? 'DP 50%' : 'Lunas'}`,
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendapatkan token pembayaran');
      }

      // 3. Trigger Midtrans Snap Popup
      window.snap.pay(data.token, {
        onSuccess: async function(result: any) {
          try {
            await updateBookingStatus(bookingId, 'PAID');
          } catch (e) {
            console.error('Failed to update status locally', e);
          }
          setSuccess(true);
          setSubmitting(false);
        },
        onPending: function(result: any) {
          // You can handle pending state here if you want
          setSuccess(true); // We'll show success but status remains PENDING
          setSubmitting(false);
        },
        onError: async function(result: any) {
          // Status updated by webhook
          toast.error('Pembayaran gagal atau dibatalkan.');
          setSubmitting(false);
        },
        onClose: function() {
          toast.error('Anda menutup popup pembayaran sebelum menyelesaikannya.');
          setSubmitting(false);
        }
      });
      
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat membuat pesanan.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-text-primary mb-2">Properti tidak ditemukan</h2>
        <button onClick={() => navigate('/')} className="text-primary font-medium hover:underline">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (success) {
    const handleWhatsApp = () => {
      const phoneNumber = siteSettings?.contactPhone || '6281234567890';
      const message = `Halo, saya baru saja melakukan booking untuk properti ${property.name} dengan tanggal check-in ${checkIn} dan check-out ${checkOut}. Mohon konfirmasinya.`;
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Berhasil!</h2>
        <p className="text-gray-600 text-sm mb-6">
          Terima kasih telah memesan <strong>{property.name}</strong>. Pesanan Anda sedang diproses.
        </p>
        
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3 text-sm border-b border-gray-200 pb-2">Detail Pesanan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Check-in:</span>
              <span className="font-medium text-gray-900">{checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Check-out:</span>
              <span className="font-medium text-gray-900">{checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tipe Pembayaran:</span>
              <span className="font-medium text-gray-900">{paymentType === 'dp' ? 'DP 50%' : 'Lunas'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
              <span className="font-bold text-gray-900">Total Dibayar:</span>
              <span className="font-bold text-blue-600">Rp {(paymentType === 'dp' ? totalPrice / 2 : totalPrice).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={handleWhatsApp} className="w-full bg-green-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Chat Admin via WhatsApp
          </button>
          <Link to="/profile" className="block w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            Lihat Pesanan Saya
          </Link>
          <Link to="/" className="block w-full bg-gray-100 text-gray-900 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24 relative font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <h1 className="text-[18px] font-bold text-gray-900 leading-tight">
          Selesaikan Pesanan
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Property Summary */}
        <div className="flex gap-3.5 pb-5 border-b border-gray-100">
          <img 
            src={property.images[0] || 'https://via.placeholder.com/150'} 
            alt={property.name} 
            className="w-20 h-20 object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-[11px] font-bold text-blue-600 mb-1 uppercase tracking-wide">{categorySlug || 'Kategori'}</div>
            <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight mb-1">{property.name}</h3>
            <div className="text-xs text-gray-500">Maks. {property.maxGuests} Tamu</div>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          <div ref={calendarRef}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pilih Tanggal</h2>
            
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {!user && (
                <div className="mb-5 space-y-4 pb-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">Data Diri (Guest)</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Masukkan alamat email"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nomor Telepon</label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="Masukkan nomor telepon"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-in</div>
                    <div className="font-bold text-gray-900 text-sm">
                      {checkIn ? new Date(checkIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum dipilih'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-out</div>
                    <div className="font-bold text-gray-900 text-sm">
                      {checkOut ? new Date(checkOut).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum dipilih'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Input */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">Punya Kode Voucher?</h3>
              <button 
                onClick={() => setShowPromoList(!showPromoList)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                Lihat Promo
              </button>
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Masukkan kode voucher" 
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm uppercase"
              />
              <button 
                onClick={() => handleApplyVoucher()}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors"
              >
                Terapkan
              </button>
            </div>
            {voucherError && <p className="text-red-500 text-xs mt-2">{voucherError}</p>}
            {appliedPromo && <p className="text-green-600 text-xs mt-2">Voucher {appliedPromo.code} berhasil diterapkan!</p>}

            {/* Promo List Dropdown */}
            {showPromoList && (
              <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Promo Tersedia</h4>
                {availablePromos.length > 0 ? (
                  availablePromos.map(promo => (
                    <div 
                      key={promo.id}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedPromoId === promo.id ? 'border-blue-500 bg-blue-50' : 'border-white bg-white hover:border-gray-200'}`}
                      onClick={() => handleApplyVoucher(promo.code)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          {promo.imageUrl && (
                            <img src={promo.imageUrl} alt={promo.title} className="w-8 h-8 rounded object-cover" />
                          )}
                          <div>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase mb-1 inline-block">
                              {promo.label || 'PROMO'}
                            </span>
                            <h5 className="font-bold text-sm text-gray-900">{promo.title}</h5>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPromoDetails(showPromoDetails === promo.id ? null : promo.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Potongan {promo.discountType === 'percentage' ? `${promo.discountAmount}%` : `Rp ${promo.discountAmount.toLocaleString('id-ID')}`}
                      </div>
                      
                      {showPromoDetails === promo.id && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600 leading-relaxed">
                          {promo.description}
                          <div className="mt-1 font-medium text-gray-400">
                            Berlaku: {new Date(promo.startDate).toLocaleDateString('id-ID')} - {new Date(promo.endDate).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Tidak ada promo tersedia untuk properti ini.</p>
                )}
              </div>
            )}
          </div>

          {/* Tour Packages Section */}
          {tourPackages.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm">Paket Wisata</h3>
                <button 
                  onClick={() => setIsTourPackagesVisible(!isTourPackagesVisible)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {isTourPackagesVisible ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
              {isTourPackagesVisible && (
                <div className="grid grid-cols-1 gap-3">
                  {tourPackages.map(tp => (
                    <div 
                      key={tp.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selectedTourPackageId === tp.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                      onClick={() => setSelectedTourPackageId(selectedTourPackageId === tp.id ? null : tp.id)}
                    >
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {tp.images && tp.images.length > 0 ? (
                        <img 
                          src={tp.images[0]} 
                          alt={tp.name} 
                          className="w-full h-full object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{tp.name}</h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTourPackageDetails(showTourPackageDetails === tp.id ? null : tp.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs font-bold text-blue-600 mb-1">Rp {tp.price.toLocaleString('id-ID')}</div>
                      
                      {showTourPackageDetails === tp.id && (
                        <div className="text-[11px] text-gray-500 mt-2 border-t border-gray-100 pt-2">
                          <p className="line-clamp-2 mb-1">{tp.description}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tour-packages/${tp.id}`);
                            }}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Lihat Detail Lengkap
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 ml-2">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedTourPackageId === tp.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                        {selectedTourPackageId === tp.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add-ons Section */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Layanan Tambahan</h3>
            <div className="grid grid-cols-1 gap-3">
              {addOns.map(addon => (
                <div 
                  key={addon.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${selectedAddOns[addon.id] ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}
                >
                  <div className="relative w-16 h-16 flex-shrink-0">
                    {addon.images && addon.images.length > 0 ? (
                      <img 
                        src={addon.images[0]} 
                        alt={addon.name} 
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-sm text-gray-900 truncate">{addon.name}</h4>
                      <button 
                        onClick={() => setShowAddOnDetails(showAddOnDetails === addon.id ? null : addon.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs font-bold text-blue-600 mb-2">Rp {addon.price.toLocaleString('id-ID')}</div>
                    
                    {showAddOnDetails === addon.id && (
                      <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">{addon.description}</p>
                    )}

                    <div className="flex items-center gap-3">
                      {selectedAddOns[addon.id] ? (
                        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1">
                          <button 
                            onClick={() => updateAddOnQuantity(addon.id, -1)}
                            className="text-gray-500 hover:text-blue-600"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-gray-900 min-w-[12px] text-center">
                            {selectedAddOns[addon.id]}
                          </span>
                          <button 
                            onClick={() => updateAddOnQuantity(addon.id, 1)}
                            className="text-gray-500 hover:text-blue-600"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => toggleAddOn(addon.id)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Metode Pembayaran</h3>
            <div className="space-y-3">
              <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${paymentType === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="paymentType" 
                    value="full" 
                    checked={paymentType === 'full'} 
                    onChange={() => setPaymentType('full')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-sm text-gray-900">Bayar Penuh</div>
                    <div className="text-xs text-gray-500">Bayar lunas sekarang</div>
                  </div>
                </div>
                <div className="font-bold text-sm text-blue-600">Rp {totalPrice.toLocaleString('id-ID')}</div>
              </label>
              
              <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${paymentType === 'dp' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="paymentType" 
                    value="dp" 
                    checked={paymentType === 'dp'} 
                    onChange={() => setPaymentType('dp')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-sm text-gray-900">Bayar DP 50%</div>
                    <div className="text-xs text-gray-500">Sisa dibayar di tempat</div>
                  </div>
                </div>
                <div className="font-bold text-sm text-blue-600">Rp {(totalPrice / 2).toLocaleString('id-ID')}</div>
              </label>
            </div>
          </div>

          {/* Price Summary */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Rincian Harga</h3>
            
            <div className="space-y-2.5 text-sm text-gray-500 mb-5">
              <div className="flex justify-between">
                <span>Harga Dasar {property?.units && property.units.length > 0 && selectedUnitIndex !== null ? `(${property.units[selectedUnitIndex].name}) ` : ''}(Rp {basePricePerNight.toLocaleString('id-ID')} x {nights} malam)</span>
                <span className="font-medium text-gray-900">Rp {(basePricePerNight * nights).toLocaleString('id-ID')}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon Promo ({appliedPromo.code})</span>
                  <span className="font-medium">- Rp {(discountPerNight * nights).toLocaleString('id-ID')}</span>
                </div>
              )}
              {Object.entries(selectedAddOns).map(([id, qty]) => {
                const addOn = addOns.find(a => a.id === id);
                if (!addOn) return null;
                return (
                  <div key={id} className="flex justify-between">
                    <span>{addOn.name} (x{qty})</span>
                    <span className="font-medium text-gray-900">Rp {(addOn.price * qty).toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
              {selectedTourPackageId && (
                <div className="flex justify-between">
                  <span>Paket Wisata ({tourPackages.find(tp => tp.id === selectedTourPackageId)?.name})</span>
                  <span className="font-medium text-gray-900">Rp {tourPackageTotal.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Biaya Layanan</span>
                <span className="font-medium text-green-600">Gratis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 px-6 animate-[slideUp_0.4s_ease-out_forwards]">
        <div className="w-full max-w-[342px] bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-4 py-2 flex items-center justify-between">
          <div className="leading-[1.2] pl-2 flex-1">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">Total Bayar</div>
            <div className="text-[16px] font-bold text-gray-900">
              Rp {(paymentType === 'dp' ? totalPrice / 2 : totalPrice).toLocaleString('id-ID')}
            </div>
          </div>
          <button 
            onClick={handleBooking}
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 text-white border-none rounded-full text-[13px] font-bold cursor-pointer transition-all hover:bg-blue-700 active:scale-95 font-sans shadow-[0_4px_12px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] shrink-0"
          >
            {submitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Konfirmasi'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
