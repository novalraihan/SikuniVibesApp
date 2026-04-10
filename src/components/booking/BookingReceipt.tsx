import React from 'react';
import { Booking, Property, TourPackage, AddOn } from '../../types';
import { Package, PlusCircle, Calendar, MapPin, CreditCard, User, Phone, Mail } from 'lucide-react';

interface BookingReceiptProps {
  booking: Booking;
  property?: Property | null;
  tourPackage?: TourPackage | null;
  addOns?: AddOn[];
}

export const BookingReceipt: React.FC<BookingReceiptProps> = ({ booking, property, tourPackage, addOns }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-indigo-600 p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-1">Struk Booking</h2>
        <p className="text-indigo-100 text-sm">ID: {booking.id}</p>
        {booking.bookingTime && (
          <p className="text-indigo-100 text-[10px] mt-1 uppercase tracking-widest">Waktu Booking: {booking.bookingTime}</p>
        )}
        <div className="mt-4 inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-white/20 backdrop-blur-sm">
          Status: {booking.status}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Guest Info */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Informasi Tamu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>{booking.guestName || 'Nama tidak tersedia'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{booking.guestPhone || 'Telepon tidak tersedia'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{booking.guestEmail || 'Email tidak tersedia'}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100"></div>

        {/* Booking Details */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Detail Pesanan</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{property?.name || booking.propertyId}</p>
                <p className="text-sm text-gray-500">{property?.location || 'Lokasi tidak tersedia'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-xs text-gray-500 mb-1">Check-in</p>
                <p className="font-medium text-gray-900 text-sm">{formatDate(booking.checkInDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Check-out</p>
                <p className="font-medium text-gray-900 text-sm">{formatDate(booking.checkOutDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add-ons & Packages */}
        {(tourPackage || (addOns && addOns.length > 0)) && (
          <>
            <div className="border-t border-gray-100"></div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Layanan Tambahan</h3>
              <div className="space-y-3">
                {tourPackage && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span>{tourPackage.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(tourPackage.price)}</span>
                  </div>
                )}
                {addOns && addOns.map((addon, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <PlusCircle className="w-4 h-4 text-purple-500" />
                      <span>{addon.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(addon.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="border-t border-gray-100"></div>

        {/* Payment Details */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Rincian Pembayaran</h3>
          <div className="space-y-2 text-sm">
            {booking.discountAmount && booking.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon Promo</span>
                <span>-{formatCurrency(booking.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
              <span>Total Pembayaran</span>
              <span>{formatCurrency(booking.totalAmount)}</span>
            </div>
            {booking.paymentType === 'dp' && booking.dpAmount && (
              <div className="flex justify-between text-indigo-600 font-medium mt-1">
                <span>DP Dibayarkan</span>
                <span>{formatCurrency(booking.dpAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
