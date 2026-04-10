import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, Search, Filter, Eye, Download, FileSpreadsheet, Users as UsersIcon, Home as HomeIcon, X } from 'lucide-react';
import { getAllBookings, updateBookingStatus } from '../../services/firebase/bookings';
import { getProperties } from '../../services/firebase/properties';
import { getAllUsers } from '../../services/firebase/users';
import { Booking, Property, User } from '../../types';
import { BookingDetailModal } from '../../components/booking/BookingDetailModal';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export function BookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsData, propertiesData, usersData] = await Promise.all([
        getAllBookings(),
        getProperties(),
        getAllUsers()
      ]);
      setBookings(bookingsData);
      setProperties(propertiesData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmUpdateId, setConfirmUpdateId] = useState<{id: string, status: Booking['status']} | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
    if (confirmUpdateId?.id === id && confirmUpdateId?.status === newStatus) {
      setUpdatingId(id);
      try {
        await updateBookingStatus(id, newStatus);
        setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
        toast.success('Status booking berhasil diperbarui');
      } catch (err: any) {
        setError(err.message || 'Gagal mengubah status booking');
        toast.error('Gagal mengubah status booking');
      } finally {
        setUpdatingId(null);
        setConfirmUpdateId(null);
      }
    } else {
      setConfirmUpdateId({ id, status: newStatus });
      setTimeout(() => setConfirmUpdateId(null), 3000);
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : propertyId;
  };

  const getUnitName = (booking: any) => {
    if (booking.unitName) return booking.unitName;
    if (booking.unitIndex !== undefined && booking.unitIndex !== null) {
      const property = properties.find(p => p.id === booking.propertyId);
      if (property && property.units && property.units[booking.unitIndex]) {
        return property.units[booking.unitIndex].name;
      }
    }
    return 'Unit Tidak Ditentukan';
  };

  const exportToExcel = () => {
    const dataToExport = filteredBookings.map(booking => ({
      'ID Booking': booking.id,
      'Nama Tamu': booking.guestName,
      'Email Tamu': booking.guestEmail,
      'Phone Tamu': booking.guestPhone,
      'Properti': getPropertyName(booking.propertyId),
      'Unit': getUnitName(booking),
      'Check In': booking.checkInDate,
      'Check Out': booking.checkOutDate,
      'Total Bayar': booking.totalAmount,
      'Tipe Bayar': booking.paymentType === 'dp' ? 'DP' : 'Lunas',
      'Status': booking.status,
      'Tanggal Dibuat': new Date(booking.createdAt).toLocaleString('id-ID')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
    XLSX.writeFile(workbook, `Bookings_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data booking berhasil diekspor ke Excel');
  };

  const exportAllTables = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Bookings Sheet
    const bookingsData = bookings.map(booking => ({
      'ID Booking': booking.id,
      'Nama Tamu': booking.guestName,
      'Email Tamu': booking.guestEmail,
      'Phone Tamu': booking.guestPhone,
      'Properti': getPropertyName(booking.propertyId),
      'Unit': getUnitName(booking),
      'Check In': booking.checkInDate,
      'Check Out': booking.checkOutDate,
      'Total Bayar': booking.totalAmount,
      'Tipe Bayar': booking.paymentType === 'dp' ? 'DP' : 'Lunas',
      'Status': booking.status,
      'Tanggal Dibuat': new Date(booking.createdAt).toLocaleString('id-ID')
    }));
    const bookingsWS = XLSX.utils.json_to_sheet(bookingsData);
    XLSX.utils.book_append_sheet(workbook, bookingsWS, 'Semua Booking');

    // 2. Properties Sheet
    const propertiesData = properties.map(prop => ({
      'ID Properti': prop.id,
      'Nama Properti': prop.name,
      'Kategori': prop.categoryId,
      'Harga Mulai': prop.basePrice,
      'Lokasi': prop.location,
      'Jumlah Unit': prop.units.length,
      'Status': prop.isActive ? 'Aktif' : 'Nonaktif'
    }));
    const propertiesWS = XLSX.utils.json_to_sheet(propertiesData);
    XLSX.utils.book_append_sheet(workbook, propertiesWS, 'Daftar Properti');

    // 3. Users Sheet
    const usersData = users.map(user => ({
      'UID': user.uid,
      'Nama': user.displayName,
      'Email': user.email,
      'Role': user.role,
      'Phone': user.phoneNumber || '-',
      'Onboarding': user.onboardingCompleted ? 'Selesai' : 'Belum'
    }));
    const usersWS = XLSX.utils.json_to_sheet(usersData);
    XLSX.utils.book_append_sheet(workbook, usersWS, 'Daftar Pengguna');

    XLSX.writeFile(workbook, `SikunirVibes_Full_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Semua tabel berhasil diekspor ke Excel');
  };

  const filteredBookings = bookings.filter(booking => {
    const propertyName = getPropertyName(booking.propertyId).toLowerCase();
    const guestName = (booking.guestName || '').toLowerCase();
    const matchesSearch = 
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guestName.includes(searchTerm.toLowerCase()) ||
      booking.propertyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propertyName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" /> Pending</span>;
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3" /> Success</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Cancel</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Booking</h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={exportAllTables}
            className="flex-1 lg:flex-none bg-indigo-900 text-white px-4 py-2.5 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-indigo-100"
          >
            <FileSpreadsheet className="h-5 w-5" />
            Download Semua Tabel
          </button>
          <button
            onClick={exportToExcel}
            className="flex-1 lg:flex-none bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-green-100"
          >
            <Download className="h-5 w-5" />
            Export Booking
          </button>
          <Link
            to="/admin/bookings/new"
            className="flex-1 lg:flex-none bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-indigo-100 no-underline"
          >
            <Calendar className="h-5 w-5" />
            Booking Manual
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Booking</p>
            <p className="text-xl font-bold text-gray-900">{bookings.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pembayaran Berhasil</p>
            <p className="text-xl font-bold text-gray-900">{bookings.filter(b => b.status === 'PAID').length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-gray-900">{bookings.filter(b => b.status === 'PENDING').length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari ID Booking, Nama Tamu, atau Properti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-12 pr-10 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="COMPLETED">Success</option>
            <option value="CANCELLED">Cancel</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">ID Booking</th>
                <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Tamu</th>
                <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Waktu Booking</th>
                <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Properti & Unit</th>
                <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Tanggal</th>
                <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Total & Info</th>
                <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="p-5 font-bold text-gray-600 text-xs uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-12 h-12 text-gray-200" />
                      <p className="font-medium">Belum ada data booking yang sesuai.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 text-sm font-medium text-gray-900">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">#{booking.id.substring(0, 8)}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {booking.guestName?.charAt(0).toUpperCase() || 'G'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{booking.guestName}</p>
                          <p className="text-xs text-gray-500">{booking.guestPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(booking.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(booking.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <HomeIcon className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-sm font-bold text-gray-900">{getPropertyName(booking.propertyId)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                          <p className="text-xs text-indigo-600 font-bold">{getUnitName(booking)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-xs font-bold text-gray-700">{new Date(booking.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-xs font-bold text-gray-700">{new Date(booking.checkOutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-bold text-gray-900">Rp {booking.totalAmount.toLocaleString('id-ID')}</div>
                      {booking.paymentType === 'dp' && (
                        <div className="text-[10px] text-orange-600 font-bold mt-1 bg-orange-50 px-2 py-0.5 rounded-full inline-block">DP: Rp {(booking.dpAmount || booking.totalAmount / 2).toLocaleString('id-ID')}</div>
                      )}
                    </td>
                    <td className="p-5">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        {updatingId === booking.id ? (
                          <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-2" />
                        ) : confirmUpdateId?.id === booking.id ? (
                          <div className="flex items-center gap-2 bg-red-50 p-1 rounded-xl border border-red-100">
                            <button
                              onClick={() => handleStatusChange(booking.id, confirmUpdateId.status)}
                              className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700"
                            >
                              Ya, {confirmUpdateId.status}
                            </button>
                            <button
                              onClick={() => setConfirmUpdateId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value as Booking['status'])}
                            className="text-xs font-bold border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Pembayaran Berhasil</option>
                            <option value="COMPLETED">Sukses</option>
                            <option value="CANCELLED">Batal</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}
    </div>
  );
}
