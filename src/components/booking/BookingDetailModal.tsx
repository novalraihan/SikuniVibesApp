import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Phone, Mail, CreditCard, Tag, Home, Map as MapIcon, PlusCircle } from 'lucide-react';
import { Booking, Property, TourPackage, AddOn } from '../../types';
import { getProperty } from '../../services/firebase/properties';
import { getTourPackage } from '../../services/firebase/tourPackages';
import { getAddOn } from '../../services/firebase/addons';

interface BookingDetailModalProps {
  booking: Booking;
  onClose: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [tourPackage, setTourPackage] = useState<TourPackage | null>(null);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (booking.propertyId) {
          const prop = await getProperty(booking.propertyId);
          setProperty(prop);
        }
        if (booking.tourPackageId) {
          const tp = await getTourPackage(booking.tourPackageId);
          setTourPackage(tp);
        }
        const addOnIds = booking.addOns?.map(a => a.addOnId) || booking.addOnIds || [];
        if (addOnIds.length > 0) {
          const addonsPromises = addOnIds.map(id => getAddOn(id));
          const addonsResults = await Promise.all(addonsPromises);
          setAddOns(addonsResults.filter((a): a is AddOn => a !== null));
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [booking]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Paid</span>;
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Success</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancel</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detail Pesanan</h2>
            <p className="text-sm text-gray-500">ID: {booking.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Status & Dates */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <div className="text-sm text-gray-500 mb-1">Status Pesanan</div>
                {getStatusBadge(booking.status)}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Waktu Booking</div>
                <div className="font-bold text-gray-900">
                  {new Date(booking.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(booking.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Check-in</div>
                <div className="font-bold text-gray-900">
                  {new Date(booking.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="w-8 h-[1px] bg-gray-300"></div>
              <div>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Check-out</div>
                <div className="font-bold text-gray-900">
                  {new Date(booking.checkOutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Informasi Tamu</h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-medium">{booking.guestName || 'Tidak ada nama'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{booking.guestEmail || 'Tidak ada email'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{booking.guestPhone || 'Tidak ada nomor telepon'}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Rincian Pembayaran</h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              {loading ? (
                <div className="animate-pulse flex flex-col gap-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  {/* Base Property Price */}
                  {property && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2"><Home className="w-4 h-4" /> {property.name}</span>
                      <span className="font-medium text-gray-900">Rp {(property.basePrice || 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {/* Tour Package Price */}
                  {tourPackage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2"><MapIcon className="w-4 h-4" /> Paket: {tourPackage.name}</span>
                      <span className="font-medium text-gray-900">Rp {(tourPackage.price || 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {/* Add-ons Prices */}
                  {addOns.length > 0 && (
                    <div className="pt-2 pb-1 border-t border-gray-50">
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Layanan Tambahan</div>
                      {addOns.map(addon => (
                        <div key={addon.id} className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 flex items-center gap-2"><PlusCircle className="w-3 h-3" /> {addon.name}</span>
                          <span className="font-medium text-gray-900">Rp {(addon.price || 0).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Discount */}
                  {booking.discountAmount ? (
                    <div className="flex justify-between text-sm items-center pt-2 border-t border-gray-50">
                      <span className="text-gray-600 flex items-center gap-1"><Tag className="w-3 h-3" /> Diskon {booking.voucherCode ? `(${booking.voucherCode})` : ''}</span>
                      <span className="font-medium text-green-600">- Rp {(booking.discountAmount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  ) : booking.voucherCode ? (
                    <div className="flex justify-between text-sm items-center pt-2 border-t border-gray-50">
                      <span className="text-gray-600 flex items-center gap-1"><Tag className="w-3 h-3" /> Voucher</span>
                      <span className="font-medium text-green-600">{booking.voucherCode}</span>
                    </div>
                  ) : null}

                  <div className="pt-3 border-t border-gray-100 flex justify-between">
                    <span className="font-bold text-gray-900">Total Harga</span>
                    <span className="font-bold text-gray-900">Rp {(booking.totalAmount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  
                  {booking.paymentType === 'dp' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pembayaran (DP 50%)</span>
                      <span className="font-medium text-orange-600">Rp {(booking.dpAmount || (booking.totalAmount || 0) / 2).toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex justify-between">
                    <span className="font-bold text-gray-900">Total Dibayar</span>
                    <span className="font-bold text-indigo-600 text-lg">
                      Rp {(booking.paymentType === 'dp' ? (booking.dpAmount || (booking.totalAmount || 0) / 2) : (booking.totalAmount || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {booking.status === 'PENDING' && booking.paymentUrl && (
            <div className="pt-4">
              <a 
                href={booking.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Lanjutkan Pembayaran
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
