import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface BookingCalendarProps {
  bookedDates: string[]; // Array of "YYYY-MM-DD"
  totalUnits?: number;
  checkIn: string;
  checkOut: string;
  onSelectCheckIn: (date: string) => void;
  onSelectCheckOut: (date: string) => void;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookedDates,
  totalUnits = 1,
  checkIn,
  checkOut,
  onSelectCheckIn,
  onSelectCheckOut
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    // Don't allow navigating to past months
    if (prev.getFullYear() < today.getFullYear() || (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())) {
      return;
    }
    setCurrentMonth(prev);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const isDateBooked = (dateStr: string) => {
    const count = bookedDates.filter(d => d === dateStr).length;
    return count >= totalUnits;
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (dateStr: string, dateObj: Date) => {
    if (isDatePast(dateObj) || isDateBooked(dateStr)) return;

    if (!checkIn || (checkIn && checkOut)) {
      onSelectCheckIn(dateStr);
      onSelectCheckOut('');
    } else {
      const checkInDate = new Date(checkIn);
      if (dateObj <= checkInDate) {
        onSelectCheckIn(dateStr);
      } else {
        // Check if there are any booked dates between checkIn and selected checkOut
        let hasBookedDatesBetween = false;
        let tempDate = new Date(checkInDate);
        tempDate.setDate(tempDate.getDate() + 1);
        
        while (tempDate < dateObj) {
          const tempStr = tempDate.toISOString().split('T')[0];
          if (isDateBooked(tempStr)) {
            hasBookedDatesBetween = true;
            break;
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }

        if (hasBookedDatesBetween) {
          toast.error('Ada tanggal yang sudah dibooking di antara rentang tanggal yang Anda pilih.');
          onSelectCheckIn(dateStr);
          onSelectCheckOut('');
        } else {
          onSelectCheckOut(dateStr);
        }
      }
    }
  };

  const renderCalendar = () => {
    const days = [];
    const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    // Render weekday headers
    const headers = weekDays.map(day => (
      <div key={day} className="text-center text-[11px] font-bold text-gray-400 uppercase py-2">
        {day}
      </div>
    ));

    // Render empty slots for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Render days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      // Adjust for local timezone to avoid off-by-one errors when converting to ISO string
      const localDateObj = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
      const dateStr = localDateObj.toISOString().split('T')[0];
      
      const isPast = isDatePast(dateObj);
      const isBooked = isDateBooked(dateStr);
      const isCheckIn = dateStr === checkIn;
      const isCheckOut = dateStr === checkOut;
      const isBetween = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

      let className = "h-10 flex flex-col items-center justify-center text-sm rounded-full transition-all cursor-pointer relative ";
      let textClass = "z-10 ";
      
      if (isPast) {
        className += "text-gray-300 cursor-not-allowed ";
      } else if (isBooked) {
        className += "text-red-400 cursor-not-allowed bg-red-50 ";
        textClass += "line-through decoration-red-300 ";
      } else if (isCheckIn || isCheckOut) {
        className += "bg-blue-600 text-white font-bold shadow-md ";
      } else if (isBetween) {
        className += "bg-blue-50 text-blue-600 font-medium rounded-none ";
      } else {
        className += "text-gray-700 hover:bg-gray-100 ";
      }

      // Adjust border radius for between dates to connect them visually
      if (isCheckIn && checkOut) className += " rounded-r-none";
      if (isCheckOut && checkIn) className += " rounded-l-none";

      days.push(
        <div 
          key={dateStr} 
          className={className}
          onClick={() => handleDateClick(dateStr, dateObj)}
        >
          <span className={textClass}>{i}</span>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-gray-900">
            {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </div>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {headers}
          {days}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] font-medium text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Terpilih</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Tidak Tersedia</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderCalendar()}
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-in</div>
          <div className="font-bold text-gray-900 text-sm">
            {checkIn ? new Date(checkIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-out</div>
          <div className="font-bold text-gray-900 text-sm">
            {checkOut ? new Date(checkOut).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
          </div>
        </div>
      </div>
    </div>
  );
};
