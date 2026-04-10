import React, { useState, useEffect } from 'react';
import { Booking, Property, AddOn, TourPackage } from '../../types';
import { Calendar, MapPin, User, Phone, Mail, CheckCircle, Info, Package, PlusCircle } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface BookingProofProps {
  booking: Booking;
  property: Property | null;
}

export function BookingProof({ booking, property }: BookingProofProps) {
  const [tourPackage, setTourPackage] = useState<TourPackage | null>(null);
  const [addOns, setAddOns] = useState<AddOn[]>([]);

  useEffect(() => {
    const fetchExtras = async () => {
      if (booking.tourPackageId) {
        try {
          const tpDoc = await getDoc(doc(db, 'tour-packages', booking.tourPackageId));
          if (tpDoc.exists()) {
            setTourPackage({ id: tpDoc.id, ...tpDoc.data() } as TourPackage);
          }
        } catch (error) {
          console.error('Error fetching tour package:', error);
        }
      }

      const addOnIds = booking.addOns?.map(a => a.addOnId) || booking.addOnIds || [];
      if (addOnIds.length > 0) {
        try {
          const addOnPromises = addOnIds.map(id => getDoc(doc(db, 'add-ons', id)));
          const addOnDocs = await Promise.all(addOnPromises);
          const fetchedAddOns = addOnDocs
            .filter(doc => doc.exists())
            .map(doc => ({ id: doc.id, ...doc.data() } as AddOn));
          setAddOns(fetchedAddOns);
        } catch (error) {
          console.error('Error fetching add-ons:', error);
        }
      }
    };

    fetchExtras();
  }, [booking]);

  return (
    <div id="booking-proof" className="bg-white p-8 max-w-4xl mx-auto border border-gray-200 rounded-xl shadow-lg print:shadow-none print:border-none print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">SIKUNIR VIBES</h1>
          <p className="text-gray-500 text-sm">Bukti Reservasi Penginapan</p>
        </div>
        <div className="text-right">
          <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-bold mb-2 inline-block">
            {booking.status}
          </div>
          <p className="text-xs text-gray-500">ID Booking: <span className="font-mono font-bold text-gray-900">{booking.id}</span></p>
          <p className="text-xs text-gray-500">Dipesan pada: {new Date(booking.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Guest & Property Info */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <User className="w-5 h-5 text-primary" />
              Informasi Tamu
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Nama Lengkap</span>
                <span className="font-semibold text-gray-900">{booking.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Email</span>
                <span className="font-semibold text-gray-900">{booking.guestEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">No. WhatsApp</span>
                <span className="font-semibold text-gray-900">{booking.guestPhone}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <Info className="w-5 h-5 text-primary" />
              Detail Akomodasi
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Nama Penginapan</span>
                <span className="font-bold text-primary">{property?.name || 'Memuat...'}</span>
              </div>
              {booking.unitId && property?.units && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 text-sm">Unit</span>
                  <span className="font-medium text-gray-900 text-right">
                    {property.units.find(u => u.id === booking.unitId)?.name || booking.unitId}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-sm">Lokasi</span>
                <span className="font-medium text-gray-900 text-right max-w-[200px]">{property?.location || 'Sikunir, Dieng'}</span>
              </div>
              {property?.coordinates && (
                <div className="text-xs text-gray-400 text-right">
                  Koordinat: {property.coordinates.lat}, {property.coordinates.lng}
                </div>
              )}
            </div>
          </section>

          {(tourPackage || addOns.length > 0) && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <Package className="w-5 h-5 text-primary" />
                Layanan Tambahan
              </h2>
              <div className="space-y-3">
                {tourPackage && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                      <Package className="w-3 h-3" /> Paket Wisata: {tourPackage.name}
                    </span>
                    <span className="font-medium text-gray-900 text-right">Rp {(tourPackage.price || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {addOns.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                      <PlusCircle className="w-3 h-3" /> Add-ons
                    </span>
                    <ul className="space-y-1 text-sm text-gray-900">
                      {addOns.map(addon => (
                        <li key={addon.id} className="flex justify-between">
                          <span>- {addon.name}</span>
                          <span className="font-medium">Rp {(addon.price || 0).toLocaleString('id-ID')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Booking & Payment Info */}
        <div className="space-y-8">
          <section className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
              <Calendar className="w-5 h-5 text-primary" />
              Jadwal Menginap
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Check-In</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(booking.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[10px] text-gray-500">Mulai 14:00 WIB</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Check-Out</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(booking.checkOutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[10px] text-gray-500">Sebelum 12:00 WIB</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-500">Durasi Menginap</span>
              <span className="text-sm font-bold text-gray-900">
                {Math.ceil(Math.abs(new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} Malam
              </span>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Rincian Pembayaran
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Harga Penginapan</span>
                <span className="font-semibold text-gray-900">Rp {(property?.basePrice || 0).toLocaleString('id-ID')}</span>
              </div>
              {booking.discountAmount && booking.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-sm italic">Diskon ({booking.voucherCode})</span>
                  <span className="font-semibold">- Rp {booking.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="text-gray-900 font-bold">Total Bayar</span>
                <span className="text-xl font-bold text-primary">Rp {(booking.totalAmount || 0).toLocaleString('id-ID')}</span>
              </div>
              {booking.paymentType === 'dp' && (
                <div className="flex justify-between items-center text-orange-600 bg-orange-50 p-3 rounded-xl mt-2">
                  <span className="font-medium text-sm">Pembayaran DP (50%)</span>
                  <span className="font-bold">Rp {(booking.dpAmount || booking.totalAmount / 2).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="bg-green-50 text-green-700 p-3 rounded-xl text-xs flex items-center gap-2 mt-4">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Pembayaran telah diverifikasi dan dikonfirmasi oleh sistem Sikunir Vibes.</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer / Notes */}
      <div className="mt-12 pt-8 border-t border-gray-100 text-center">
        <p className="text-sm font-bold text-gray-900 mb-2">Terima Kasih Telah Memilih Sikunir Vibes!</p>
        <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
          Harap tunjukkan bukti reservasi ini (digital atau cetak) saat melakukan check-in. 
          Jika Anda memiliki pertanyaan, silakan hubungi kami melalui WhatsApp atau menu Chat di aplikasi.
        </p>
        <div className="mt-8 flex justify-center gap-8 text-[10px] text-gray-400 uppercase tracking-widest">
          <span>www.sikunirvibes.com</span>
          <span>@sikunirvibes</span>
        </div>
      </div>
    </div>
  );
}
