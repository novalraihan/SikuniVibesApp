import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, Package, PlusCircle, X, Eye } from 'lucide-react';
import { getAllBookings } from '../../services/firebase/bookings';
import { getAddOns } from '../../services/firebase/addons';
import { getProperties } from '../../services/firebase/properties';
import { Booking, AddOn, Property } from '../../types';
import { BookingDetailModal } from '../../components/booking/BookingDetailModal';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [addOns, setAddOns] = useState<Record<string, AddOn>>({});
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsData, addOnsData, propertiesData] = await Promise.all([
        getAllBookings(),
        getAddOns(),
        getProperties()
      ]);
      setBookings(bookingsData);
      
      const addOnsMap: Record<string, AddOn> = {};
      addOnsData.forEach(addon => {
        addOnsMap[addon.id] = addon;
      });
      setAddOns(addOnsMap);

      const propertiesMap: Record<string, Property> = {};
      propertiesData.forEach(property => {
        propertiesMap[property.id] = property;
      });
      setProperties(propertiesMap);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 md:p-4 border border-gray-100 bg-gray-50/50 min-h-[80px] md:min-h-[120px]"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayBookings = bookings.filter(b => {
        if (!b.checkInDate || !b.checkOutDate) return false;
        try {
          const checkIn = b.checkInDate;
          const checkOut = b.checkOutDate;
          return dateString >= checkIn && dateString < checkOut; // Don't show booking on checkout day
        } catch (e) {
          return false;
        }
      });

      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isToday = todayString === dateString;

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(dateString)}
          className={`p-1 md:p-2 border border-gray-100 min-h-[80px] md:min-h-[120px] transition-colors cursor-pointer ${isToday ? 'bg-indigo-50/30' : 'bg-white hover:bg-gray-50'}`}
        >
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <span className={`text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
              {day}
            </span>
            {dayBookings.length > 0 && (
              <span className="text-[10px] md:text-xs font-medium text-gray-500 bg-gray-100 px-1.5 md:px-2 py-0.5 rounded-full">
                {dayBookings.length}
              </span>
            )}
          </div>
          
          {/* Mobile View: Dots */}
          <div className="flex flex-wrap gap-1 md:hidden mt-1">
            {dayBookings.slice(0, 3).map((booking, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full ${
                  booking.status === 'PAID' ? 'bg-green-500' :
                  booking.status === 'PENDING' ? 'bg-yellow-500' :
                  booking.status === 'CANCELLED' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}
              />
            ))}
            {dayBookings.length > 3 && <span className="text-[8px] text-gray-400">+{dayBookings.length - 3}</span>}
          </div>

          {/* Desktop View: List */}
          <div className="hidden md:block space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayBookings.map(booking => {
              const propertyName = properties[booking.propertyId]?.name || booking.propertyId;
              return (
                <div 
                  key={booking.id} 
                  className={`text-[10px] md:text-xs p-1 md:p-1.5 rounded truncate border ${
                    booking.status === 'PAID' ? 'bg-green-50 border-green-200 text-green-800' :
                    booking.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    booking.status === 'CANCELLED' ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                  title={`${booking.guestName} - ${propertyName}`}
                >
                  <div className="font-medium truncate">{booking.guestName}</div>
                  <div className="text-[9px] opacity-80 truncate">{propertyName}</div>
                  <div className="flex items-center gap-1 mt-0.5 opacity-75">
                    {booking.tourPackageId && <Package className="w-3 h-3" />}
                    {((booking as any).addOns?.length > 0 || booking.addOnIds?.length > 0) && <PlusCircle className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedDayBookings = selectedDate ? bookings.filter(b => {
    if (!b.checkInDate || !b.checkOutDate) return false;
    try {
      return selectedDate >= b.checkInDate && selectedDate < b.checkOutDate;
    } catch (e) {
      return false;
    }
  }) : [];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
          Kalender Booking
        </h1>
        <div className="flex items-center gap-2 md:gap-4 bg-white px-3 md:px-4 py-2 rounded-lg shadow-sm border border-gray-100 w-full sm:w-auto justify-between sm:justify-start">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <span className="text-sm md:text-lg font-semibold text-gray-800 min-w-[120px] md:min-w-[150px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {dayNames.map(day => (
              <div key={day} className="p-2 md:p-4 text-center text-xs md:text-sm font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {renderCalendar()}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-gray-600 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Selesai</span>
        </div>
      </div>

      {/* Modal for Selected Date */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">
                Booking: {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {selectedDayBookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayBookings.map(booking => (
                    <div key={booking.id} className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-gray-900">{booking.guestName}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            booking.status === 'PAID' ? 'bg-green-100 text-green-700' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1 mb-2">
                        <div><span className="font-medium">Properti:</span> {properties[booking.propertyId]?.name || booking.propertyId}</div>
                        <div><span className="font-medium">Check-in:</span> {new Date(booking.checkInDate).toLocaleDateString('id-ID')}</div>
                        <div><span className="font-medium">Check-out:</span> {new Date(booking.checkOutDate).toLocaleDateString('id-ID')}</div>
                      </div>

                      {(booking.tourPackageId || ((booking as any).addOns?.length > 0) || (booking.addOnIds?.length > 0)) && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-xs font-semibold text-gray-700 mb-1">Tambahan:</div>
                          <div className="flex flex-col gap-1">
                            {booking.tourPackageId && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md w-fit">
                                <Package className="w-3 h-3" /> Paket Wisata
                              </span>
                            )}
                            {((booking as any).addOns || booking.addOnIds)?.map((addonId: string, idx: number) => {
                              const addonName = addOns[addonId]?.name || 'Add-on';
                              return (
                                <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-md w-fit">
                                  <PlusCircle className="w-3 h-3" /> {addonName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Tidak ada booking pada tanggal ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
