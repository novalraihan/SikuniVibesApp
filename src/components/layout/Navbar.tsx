import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { signInWithGoogle, logOut } from '../../services/firebase/auth';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { Home, Compass, Map, Tag, FileText, User as UserIcon, LayoutDashboard, LogIn, LogOut, Heart, Settings, ClipboardList, TrendingUp, Bell, X } from 'lucide-react';
import { subscribeToUserNotifications, markNotificationAsRead, Notification } from '../../services/firebase/notifications';

export function Navbar() {
  const { user, isAuthReady } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) setSettings(data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUserNotifications(user.uid, (data) => {
        setNotifications(data);
      });
      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const isPropertyDetails = location.pathname.startsWith('/properties/');
  const isCheckout = location.pathname.startsWith('/checkout/');
  const isJeepPage = location.pathname.startsWith('/jeeps');
  const isTourPackagePage = location.pathname.startsWith('/tour-packages');
  const hideMobileNav = isPropertyDetails || isCheckout || isJeepPage || isTourPackagePage;

  return (
    <nav className={`fixed bg-white border-t border-border bottom-0 left-0 right-0 h-[64px] flex items-stretch z-[100] shadow-[0_-2px_12px_rgba(0,0,0,0.07)] md:top-0 md:bottom-auto md:border-t-0 md:border-b md:h-[70px] md:px-[5%] md:shadow-sm md:items-center md:gap-0 md:bg-surface md:rounded-none
      max-md:bottom-6 max-md:left-6 max-md:right-6 max-md:rounded-full max-md:border-none max-md:shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-md:px-2 max-md:items-center max-md:justify-between ${hideMobileNav ? 'max-md:hidden' : ''}`}>
      
      {/* Desktop brand + links */}
      <Link to="/" className="hidden md:flex items-center gap-2 mr-auto no-underline">
        {settings?.logoUrl ? (
          <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
        ) : (
          <span className="text-[20px] font-extrabold text-primary tracking-[-0.5px]">
            Sikunir <span className="text-accent">Vibes</span>
          </span>
        )}
      </Link>

      <div className="hidden md:flex items-center gap-1 mr-4">
        <Link to="/" className={`px-3.5 py-2 rounded-sm text-sm font-medium cursor-pointer transition-all no-underline ${isActive('/') ? 'text-primary bg-primary-light' : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'}`}>Beranda</Link>
        <Link to="/explore" className={`px-3.5 py-2 rounded-sm text-sm font-medium cursor-pointer transition-all no-underline ${isActive('/explore') ? 'text-primary bg-primary-light' : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'}`}>Jelajah</Link>
        <Link to="/map" className={`px-3.5 py-2 rounded-sm text-sm font-medium cursor-pointer transition-all no-underline ${isActive('/map') ? 'text-primary bg-primary-light' : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'}`}>Peta</Link>
        <Link to="/promos" className={`px-3.5 py-2 rounded-sm text-sm font-medium cursor-pointer transition-all no-underline ${isActive('/promos') ? 'text-primary bg-primary-light' : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'}`}>Promo</Link>
        <Link to="/blogs" className={`px-3.5 py-2 rounded-sm text-sm font-medium cursor-pointer transition-all no-underline ${isActive('/blogs') ? 'text-primary bg-primary-light' : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'}`}>Blog</Link>
        <Link to="/cek-booking" className={`px-3.5 py-2 rounded-sm text-sm font-medium cursor-pointer transition-all no-underline ${isActive('/cek-booking') ? 'text-primary bg-primary-light' : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'}`}>Cek Booking</Link>
      </div>

      <div className="hidden md:flex items-center gap-2">
        {isAuthReady ? (
          user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Link to="/admin" className="px-4 py-2 rounded-sm border border-border-strong bg-transparent text-sm font-semibold cursor-pointer text-text-primary transition-all hover:bg-surface-alt flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link to="/wishlist" className="px-4 py-2 rounded-sm border border-border-strong bg-transparent text-sm font-semibold cursor-pointer text-text-primary transition-all hover:bg-surface-alt flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Wishlist
              </Link>
              <Link to="/affiliate" className="px-4 py-2 rounded-sm border border-border-strong bg-transparent text-sm font-semibold cursor-pointer text-text-primary transition-all hover:bg-surface-alt flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Affiliate
              </Link>
              <Link to="/profile" className="px-4 py-2 rounded-sm border border-border-strong bg-transparent text-sm font-semibold cursor-pointer text-text-primary transition-all hover:bg-surface-alt flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {user.displayName}
              </Link>
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-text-secondary hover:text-primary transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <h3 className="font-bold text-gray-900">Notifikasi</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Belum ada notifikasi</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!notification.isRead ? 'bg-blue-600' : 'bg-transparent'}`} />
                                <div>
                                  <p className={`text-sm ${!notification.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-2">
                                    {notification.createdAt?.toDate ? new Date(notification.createdAt.toDate()).toLocaleString('id-ID', {
                                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    }) : 'Baru saja'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={logOut}
                className="px-4 py-2 rounded-sm border border-border-strong bg-transparent text-sm font-semibold cursor-pointer text-text-primary transition-all hover:bg-surface-alt flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-sm border border-border-strong bg-transparent text-sm font-semibold cursor-pointer text-text-primary transition-all hover:bg-surface-alt flex items-center gap-2 no-underline">
                <LogIn className="h-4 w-4" />
                Masuk
              </Link>
              <Link to="/login" state={{ isRegister: true }} className="px-4.5 py-2 rounded-sm bg-primary text-white text-sm font-semibold border-none cursor-pointer transition-colors hover:bg-primary-dark no-underline">
                Daftar Gratis
              </Link>
            </>
          )
        ) : (
          <div className="h-9 w-24 bg-gray-200 animate-pulse rounded"></div>
        )}
      </div>

      {/* Mobile bottom nav items */}
      <Link to="/" className={`md:hidden flex items-center justify-center gap-2 cursor-pointer no-underline text-sm font-medium transition-all py-2.5 px-3 rounded-full ${isActive('/') ? 'bg-[#bbf7d0] text-black' : 'text-gray-400'}`}>
        <Home className="w-5 h-5" />
        {isActive('/') && <span>Home</span>}
      </Link>
      <Link to="/explore" className={`md:hidden flex items-center justify-center gap-2 cursor-pointer no-underline text-sm font-medium transition-all py-2.5 px-3 rounded-full ${isActive('/explore') ? 'bg-[#bbf7d0] text-black' : 'text-gray-400'}`}>
        <Compass className="w-5 h-5" />
        {isActive('/explore') && <span>Explore</span>}
      </Link>

      <Link to="/cek-booking" className={`md:hidden flex items-center justify-center gap-2 cursor-pointer no-underline text-sm font-medium transition-all py-2.5 px-3 rounded-full ${isActive('/cek-booking') ? 'bg-[#bbf7d0] text-black' : 'text-gray-400'}`}>
        <ClipboardList className="w-5 h-5" />
        {isActive('/cek-booking') && <span>Booking</span>}
      </Link>
      <Link to="/wishlist" className={`md:hidden flex items-center justify-center gap-2 cursor-pointer no-underline text-sm font-medium transition-all py-2.5 px-3 rounded-full ${isActive('/wishlist') ? 'bg-[#bbf7d0] text-black' : 'text-gray-400'}`}>
        <Heart className="w-5 h-5" />
        {isActive('/wishlist') && <span>Wishlist</span>}
      </Link>
      
      {/* Notification button removed from here */}

      <Link 
        to={user ? "/profile" : "/login"}
        className={`md:hidden flex items-center justify-center gap-2 cursor-pointer no-underline text-sm font-medium transition-all py-2.5 px-3 rounded-full ${isActive('/profile') && user ? 'bg-[#bbf7d0] text-black' : 'text-gray-400'}`}
      >
        {user ? (
          <div className="flex items-center justify-center gap-2 text-inherit no-underline">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
            {isActive('/profile') && <span>Profile</span>}
          </div>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            {isActive('/login') && <span>Login</span>}
          </>
        )}
      </Link>
    </nav>
  );
}
