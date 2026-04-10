import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Calendar, Tag, List, Percent, Users, Settings, MessageCircle, LogOut, FileText, Mail, Car, Package, Map, ClipboardList, MessageSquare, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { logOut } from '../../services/firebase/auth';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuGroups: { title: string; roles?: string[]; items: { path: string; label: string; icon: any; roles?: string[] }[] }[] = [
    {
      title: 'Utama',
      roles: ['super_admin', 'admin', 'resepsionis'],
      items: [
        { path: '/admin', label: 'Dashboard', icon: Home },
        { path: '/admin/calendar', label: 'Kalender', icon: Calendar },
        { path: '/admin/bookings', label: 'Booking', icon: ClipboardList },
      ]
    },
    {
      title: 'Manajemen Properti',
      roles: ['super_admin', 'admin'],
      items: [
        { path: '/admin/properties', label: 'Properti', icon: Home },
        { path: '/admin/categories', label: 'Kategori', icon: Tag },
        { path: '/admin/amenities', label: 'Fasilitas', icon: List },
      ]
    },
    {
      title: 'Layanan Tambahan',
      roles: ['super_admin', 'admin'],
      items: [
        { path: '/admin/jeeps', label: 'Kelola Jeep', icon: Car },
        { path: '/admin/addons', label: 'Paket Tambahan', icon: Package },
        { path: '/admin/tour-packages', label: 'Paket Wisata', icon: Map },
        { path: '/admin/attractions', label: 'Kelola Wisata', icon: Map },
      ]
    },
    {
      title: 'Pemasaran & Komunikasi',
      roles: ['super_admin', 'admin', 'resepsionis'],
      items: [
        { path: '/admin/promos', label: 'Promo', icon: Percent, roles: ['super_admin', 'admin'] },
        { path: '/admin/blogs', label: 'Blog', icon: FileText, roles: ['super_admin', 'admin'] },
        { path: '/admin/chats', label: 'Pesan', icon: MessageCircle, roles: ['super_admin', 'admin', 'resepsionis'] },
        { path: '/admin/communication', label: 'Pusat Komunikasi', icon: Mail, roles: ['super_admin', 'admin'] },
      ]
    },
    {
      title: 'Pengguna & Affiliate',
      roles: ['super_admin', 'admin'],
      items: [
        { path: '/admin/users', label: 'Pengguna', icon: Users },
        { path: '/admin/affiliates', label: 'Kelola Affiliate', icon: Users },
        { path: '/admin/withdrawals', label: 'Penarikan Dana', icon: Wallet },
        { path: '/admin/surveys', label: 'Hasil Survei', icon: ClipboardList },
      ]
    },
    {
      title: 'Sistem',
      roles: ['super_admin'],
      items: [
        { path: '/admin/logs', label: 'Log Aktivitas', icon: List },
        { path: '/admin/settings', label: 'Pengaturan', icon: Settings },
      ]
    }
  ];

  const filteredMenuGroups = menuGroups.filter(group => !group.roles || group.roles.includes(user?.role as string)).map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || item.roles.includes(user?.role as string))
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 shadow-sm z-20">
        <Link to="/" className="text-xl font-bold text-primary">Sikunir Vibes</Link>
        <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none md:border-l border-gray-200
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user?.displayName?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.displayName || 'Admin'}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-6 px-3">
              {filteredMenuGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {group.title}
                  </h3>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors mb-2">
              <Home className="w-5 h-5 text-gray-400" />
              Kembali ke Web
            </Link>
            <button
              onClick={logOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
