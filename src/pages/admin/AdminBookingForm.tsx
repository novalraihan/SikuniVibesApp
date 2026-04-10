import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Property } from '../../types';
import { getProperties } from '../../services/firebase/properties';
import { createBooking } from '../../services/firebase/bookings';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export function AdminBookingForm() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);

  const [formData, setFormData] = useState({
    propertyId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkInDate: '',
    checkOutDate: '',
    totalAmount: 0,
    status: 'PAID' as const,
    paymentType: 'full' as 'full' | 'dp',
    dpAmount: 0,
    voucherCode: '',
    discountAmount: 0,
  });

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const props = await getProperties();
        setProperties(props.filter(p => p.isActive));
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Gagal memuat data properti");
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: name === 'totalAmount' ? Number(value) : value };
      
      // Calculate total amount if property and dates are selected
      if ((name === 'propertyId' || name === 'checkInDate' || name === 'checkOutDate') && 
          newData.propertyId && newData.checkInDate && newData.checkOutDate) {
        const property = properties.find(p => p.id === newData.propertyId);
        if (property) {
          const checkIn = new Date(newData.checkInDate);
          const checkOut = new Date(newData.checkOutDate);
          if (checkOut > checkIn) {
            let total = 0;
            let current = new Date(checkIn);
            while (current < checkOut) {
              const dateStr = current.toISOString().split('T')[0];
              const dayOfWeek = current.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              
              let priceForNight = property.basePrice;
              if (property.dynamicPrices) {
                if (property.dynamicPrices[dateStr]) {
                  priceForNight = property.dynamicPrices[dateStr];
                } else if (isWeekend && property.dynamicPrices['weekend']) {
                  priceForNight = property.dynamicPrices['weekend'];
                }
              }
              
              total += priceForNight;
              current.setDate(current.getDate() + 1);
            }
            newData.totalAmount = total;
          } else {
            newData.totalAmount = 0;
          }
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyId || !formData.checkInDate || !formData.checkOutDate) {
      toast.error("Harap lengkapi properti dan tanggal");
      return;
    }

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    if (checkOut <= checkIn) {
      toast.error("Tanggal check-out harus setelah check-in");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Generate booked dates array
      const bookedDates: string[] = [];
      let currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        bookedDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const bookingId = await createBooking({
        propertyId: formData.propertyId,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        totalAmount: formData.totalAmount,
        paymentType: formData.paymentType,
        dpAmount: formData.paymentType === 'dp' ? (formData.dpAmount || formData.totalAmount / 2) : undefined,
        voucherCode: formData.voucherCode || undefined,
        discountAmount: formData.discountAmount || undefined,
        userId: user?.uid, // Admin's UID
        updatedAt: Date.now(),
      }, bookedDates);
      
      if ((formData.status as string) !== 'PENDING') {
        import('../../services/firebase/bookings').then(({ updateBookingStatus }) => {
          updateBookingStatus(bookingId, formData.status as any);
        });
      }
      
      navigate('/admin/bookings');
      toast.success('Booking berhasil dibuat');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat membuat booking');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Buat Booking Manual</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Properti</label>
            <select
              name="propertyId"
              required
              value={formData.propertyId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">Pilih Properti</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} - Rp {p.basePrice.toLocaleString('id-ID')}/malam</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Check-in</label>
              <input
                type="date"
                name="checkInDate"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.checkInDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Check-out</label>
              <input
                type="date"
                name="checkOutDate"
                required
                min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                value={formData.checkOutDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tamu</label>
              <input
                type="text"
                name="guestName"
                required
                value={formData.guestName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP Tamu</label>
              <input
                type="tel"
                name="guestPhone"
                required
                value={formData.guestPhone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Tamu (Opsional)</label>
            <input
              type="email"
              name="guestEmail"
              value={formData.guestEmail}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Pembayaran</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Success</option>
                <option value="CANCELLED">Cancel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pembayaran</label>
              <select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="full">Bayar Penuh</option>
                <option value="dp">DP (Down Payment)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Voucher (Opsional)</label>
              <input
                type="text"
                name="voucherCode"
                value={formData.voucherCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Harga (Rp)</label>
              <input
                type="number"
                name="totalAmount"
                required
                min="0"
                value={formData.totalAmount}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50"
              />
            </div>
          </div>
          
          {formData.paymentType === 'dp' && (
            <div className="grid grid-cols-2 gap-4">
              <div></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah DP (Rp)</label>
                <input
                  type="number"
                  name="dpAmount"
                  min="0"
                  max={formData.totalAmount}
                  value={formData.dpAmount || formData.totalAmount / 2}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 50% dari total harga</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                Buat Booking
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
