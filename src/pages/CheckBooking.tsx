import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Calendar, Clock, CheckCircle, XCircle, History, Download, Printer, MessageCircle, Home, Map as MapIcon, PlusCircle, Tag } from 'lucide-react';
import { Booking, Property, TourPackage, AddOn } from '../types';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BookingProof } from '../components/booking/BookingProof';
import { BookingReceipt } from '../components/booking/BookingReceipt';
import { getSiteSettings, SiteSettings } from '../services/firebase/settings';
import { toast } from 'sonner';

import { TopBar } from '../components/layout/TopBar';

interface CachedBooking {
  id: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  contact: string;
  createdAt: number;
}

export function CheckBooking() {
  const [searchParams] = useSearchParams();
  const [bookingId, setBookingId] = useState(searchParams.get('id') || '');
  const [contact, setContact] = useState(searchParams.get('contact') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [tourPackage, setTourPackage] = useState<TourPackage | null>(null);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [cachedBookings, setCachedBookings] = useState<CachedBooking[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('guestBookings');
    if (cached) {
      try {
        setCachedBookings(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse cached bookings', e);
      }
    }
    
    getSiteSettings().then(data => {
      if (data) setSettings(data);
    }).catch(console.error);

    // Auto-check if params are present
    if (bookingId && contact) {
      handleCheck(new Event('submit') as any);
    }
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !contact) {
      toast.error('Harap masukkan ID Booking dan Email/No. HP');
      return;
    }

    setLoading(true);
    setError('');
    setBooking(null);
    setProperty(null);

    try {
      // Fetch booking
      const bookingRef = doc(db, 'bookings', bookingId.trim());
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking tidak ditemukan');
      }

      const bookingData = bookingSnap.data() as Booking;

      // Verify contact
      const isEmailMatch = bookingData.guestEmail?.toLowerCase() === contact.trim().toLowerCase();
      const isPhoneMatch = bookingData.guestPhone === contact.trim();

      if (!isEmailMatch && !isPhoneMatch) {
        throw new Error('Data kontak tidak cocok dengan booking ini');
      }

      setBooking(bookingData);

      // Fetch property details
      const propertyRef = doc(db, 'properties', bookingData.propertyId);
      const propertySnap = await getDoc(propertyRef);
      if (propertySnap.exists()) {
        setProperty(propertySnap.data() as Property);
      }

      // Fetch Tour Package
      if (bookingData.tourPackageId) {
        const tpRef = doc(db, 'tour-packages', bookingData.tourPackageId);
        const tpSnap = await getDoc(tpRef);
        if (tpSnap.exists()) {
          setTourPackage({ id: tpSnap.id, ...tpSnap.data() } as TourPackage);
        }
      }

      // Fetch Add-ons
      const addOnIds = bookingData.addOns?.map((a: any) => a.addOnId) || bookingData.addOnIds || [];
      if (addOnIds.length > 0) {
        const addOnPromises = addOnIds.map((id: string) => getDoc(doc(db, 'add-ons', id)));
        const addOnDocs = await Promise.all(addOnPromises);
        const fetchedAddOns = addOnDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as AddOn));
        setAddOns(fetchedAddOns);
      }

    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memeriksa booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('booking-proof-content');
    if (!element) return;

    const opt = {
      margin:       10,
      filename:     `Booking_${booking?.id}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Failed to load html2pdf", error);
    }
  };

  const handleChatAdmin = () => {
    const phoneNumber = settings?.contactPhone || '6281234567890'; // Fallback number
    const message = `Halo Admin, saya ingin bertanya mengenai booking saya dengan ID: ${booking?.id}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"><Clock className="w-4 h-4" /> Pending</span>;
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><CheckCircle className="w-4 h-4" /> Paid</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"><CheckCircle className="w-4 h-4" /> Success</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><XCircle className="w-4 h-4" /> Cancel</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Cek Status Booking" />
      
      <div className="max-w-3xl mx-auto space-y-8 px-4 md:px-0 py-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Cek Status Booking</h1>
          <p className="text-gray-600">Masukkan ID Booking dan Email atau No. HP yang digunakan saat memesan</p>
        </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Booking</label>
              <input
                type="text"
                required
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Contoh: abc123xyz"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email atau No. HP</label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email atau No. HP"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Cek Booking
              </>
            )}
          </button>
        </form>
      </div>

      {booking && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <BookingReceipt booking={booking} property={property} tourPackage={tourPackage} addOns={addOns} />
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <Printer className="w-5 h-5" />
              Cetak Bukti Booking
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={handleChatAdmin}
              className="flex-1 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              Chat Admin
            </button>
          </div>
        </div>
      )}

      {/* Hidden Booking Proof for Printing/PDF */}
      {booking && (
        <div id="booking-proof-content" style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
          <BookingProof booking={booking} property={property} />
        </div>
      )}

      {!booking && cachedBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700">
            <History className="w-5 h-5" />
            <h2 className="text-lg font-bold">Riwayat Pencarian Terakhir</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cachedBookings.sort((a, b) => b.createdAt - a.createdAt).map((cached) => (
              <div 
                key={cached.id} 
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-300 cursor-pointer transition-colors"
                onClick={() => {
                  setBookingId(cached.id);
                  setContact(cached.contact);
                  // Optionally auto-submit
                  // handleCheck(new Event('submit') as unknown as React.FormEvent);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{cached.propertyName || 'Properti'}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-mono">{cached.id}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(cached.checkIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(cached.checkOut).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="font-medium text-indigo-600 mt-2">
                    Rp {cached.totalPrice.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
