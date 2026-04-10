import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Calendar, DollarSign, Tag, Percent, Settings, Users, List, CalendarDays, MessageCircle, Clock, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { getAllBookings } from '../../services/firebase/bookings';
import { getAllUsers } from '../../services/firebase/users';
import { getLogs, LogEntry } from '../../services/firebase/logs';
import { Booking, User } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

export function AdminDashboard() {
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [visitsChartData, setVisitsChartData] = useState<any[]>([]);
  const [affiliateChartData, setAffiliateChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookings, users, dbLogs] = await Promise.all([
          getAllBookings(),
          getAllUsers(),
          getLogs(20)
        ]);
        
        setTotalBookings(bookings.length);
        
        // Calculate revenue only from paid bookings and DP
        const revenue = bookings
          .filter(b => b.status === 'PAID' || b.status === 'COMPLETED')
          .reduce((sum, b) => {
            if (b.status === 'COMPLETED') {
              return sum + b.totalAmount;
            }
            if (b.paymentType === 'dp') {
              return sum + (b.dpAmount || b.totalAmount / 2);
            }
            return sum + b.totalAmount;
          }, 0);
          
        setTotalRevenue(revenue);

        // Create activity logs
        const activities = [
          ...dbLogs,
          ...bookings.map(b => ({
            id: `booking-${b.id}`,
            type: 'booking',
            title: `Booking Baru: ${(b as any).propertyName || b.propertyId}`,
            description: `${b.guestName} melakukan booking untuk ${new Date(b.checkInDate).toLocaleDateString('id-ID')} sejumlah Rp ${b.totalAmount.toLocaleString('id-ID')}. Status: ${b.status}`,
            date: b.createdAt,
            status: b.status
          })),
          ...users.map(u => ({
            id: `user-${u.uid}`,
            type: 'user',
            title: 'Pengguna Baru',
            description: `${u.displayName || 'Pengguna'} (${u.email}) mendaftar ke sistem.`,
            date: u.createdAt,
            status: 'success'
          }))
        ].sort((a, b) => b.date - a.date).slice(0, 15); // Get latest 15 activities

        setRecentActivities(activities);

        // Chart Data Processing
        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          d.setHours(0, 0, 0, 0);
          return d;
        });

        const salesData = last7Days.map(date => {
          const nextDay = new Date(date);
          nextDay.setDate(date.getDate() + 1);
          
          return {
            name: date.toLocaleDateString('id-ID', { weekday: 'short' }),
            penjualan: bookings.filter(b => {
              return b.createdAt >= date.getTime() && b.createdAt < nextDay.getTime() && (b.status === 'PAID' || b.status === 'COMPLETED');
            }).reduce((sum, b) => {
              if (b.status === 'COMPLETED') {
                return sum + b.totalAmount;
              }
              if (b.paymentType === 'dp') {
                return sum + (b.dpAmount || b.totalAmount / 2);
              }
              return sum + b.totalAmount;
            }, 0)
          };
        });

        const visitsData = last7Days.map(date => ({
          name: date.toLocaleDateString('id-ID', { weekday: 'short' }),
          kunjungan: Math.floor(Math.random() * 50) + 10 // Mock data for visits
        }));

        const affiliateBookings = bookings.filter(b => b.affiliateId).length;
        const regularBookings = bookings.length - affiliateBookings;
        
        const affiliateData = [
          { name: 'Affiliate', value: affiliateBookings },
          { name: 'Regular', value: regularBookings }
        ];

        setSalesChartData(salesData);
        setVisitsChartData(visitsData);
        setAffiliateChartData(affiliateData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit yang lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam yang lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari yang lalu`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 text-sm font-medium">Total Booking</h3>
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : totalBookings}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 text-sm font-medium">Pendapatan</h3>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 text-sm font-medium">Pengunjung Hari Ini</h3>
            <Users className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : visitsChartData[visitsChartData.length - 1]?.kunjungan || 0}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Grafik Penjualan (7 Hari Terakhir)</h2>
          </div>
          <div className="h-64 min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `Rp ${value/1000}k`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="penjualan" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Sumber Booking</h2>
          </div>
          <div className="h-64 min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={affiliateChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {affiliateChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {affiliateChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm text-gray-600">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Menu Manajemen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/admin/users" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Pengguna</h3>
                <Users className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Kelola</p>
            </Link>
            <Link to="/admin/properties" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Properti</h3>
                <Home className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Kelola</p>
            </Link>
            <Link to="/admin/categories" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Kategori</h3>
                <Tag className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Kelola</p>
            </Link>
            <Link to="/admin/amenities" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Fasilitas</h3>
                <List className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Kelola</p>
            </Link>
            <Link to="/admin/promos" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Promo</h3>
                <Percent className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Kelola</p>
            </Link>
            <Link to="/admin/chats" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Live Chat</h3>
                <MessageCircle className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Kelola</p>
            </Link>
            <Link to="/admin/bookings" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Booking</h3>
                <Calendar className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Kelola</p>
            </Link>
            <Link to="/admin/calendar" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Kalender</h3>
                <CalendarDays className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Lihat</p>
            </Link>
            <Link to="/admin/settings" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">Pengaturan</h3>
                <Settings className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-xl font-bold text-gray-900">Kelola</p>
            </Link>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Log Aktivitas</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="relative border-l border-gray-200 ml-3 space-y-6">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id} className="relative pl-6">
                    <span className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full ring-4 ring-white ${
                      activity.type === 'booking' 
                        ? activity.status === 'PAID' ? 'bg-green-500' : activity.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                        : 'bg-indigo-500'
                    }`}></span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{activity.title}</span>
                      <span className="text-sm text-gray-600 mt-0.5">{activity.description}</span>
                      <span className="text-xs text-gray-400 mt-1">{getTimeAgo(activity.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                Belum ada aktivitas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
