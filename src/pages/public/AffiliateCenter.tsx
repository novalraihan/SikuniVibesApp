import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Copy, CheckCircle, Clock, TrendingUp, AlertCircle, Wallet, X, LayoutDashboard, Link as LinkIcon, ListOrdered, History, Building, Share2, MessageCircle, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { Booking, Property } from '../../types';

const AffiliateCenter: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalBookings: 0,
    conversionRate: 0,
  });
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: user?.affiliateBankDetails?.bankName || '',
    accountNumber: user?.affiliateBankDetails?.accountNumber || '',
    accountName: user?.affiliateBankDetails?.accountName || ''
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [pendingWithdrawalsTotal, setPendingWithdrawalsTotal] = useState(0);
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [registrationForm, setRegistrationForm] = useState({
    namaKTP: '',
    nik: '',
    alamat: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    termsAgreed: false
  });

  const [latestUserData, setLatestUserData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/affiliate' } } });
      return;
    }

    const fetchAffiliateData = async () => {
      try {
        if (user.affiliateStatus === 'suspended') {
          setIsSuspendedModalOpen(true);
        }

        // Fetch latest user data to get updated clicks and balance
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const latestUser = userSnap.exists() ? userSnap.data() as any : user;
        setLatestUserData(latestUser);

        if (user.affiliateStatus === 'approved' && user.affiliateCode) {
          // Fetch bookings referred by this affiliate
          const bookingsRef = collection(db, 'bookings');
          const q = query(bookingsRef, where('affiliateId', '==', user.uid));
          const snapshot = await getDocs(q);
          const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
          
          // Sort by createdAt descending
          fetchedBookings.sort((a, b) => b.createdAt - a.createdAt);
          setBookings(fetchedBookings);

          // Fetch active properties
          const propertiesRef = collection(db, 'properties');
          const pQ = query(propertiesRef, where('isActive', '==', true));
          const pSnapshot = await getDocs(pQ);
          const fetchedProperties = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
          setProperties(fetchedProperties);

          // Calculate stats
          const totalBookings = fetchedBookings.length;
          const totalClicks = latestUser.affiliateClicks || 0;
          const conversionRate = totalClicks > 0 ? ((totalBookings / totalClicks) * 100).toFixed(1) : 0;
          
          setStats({
            totalClicks,
            totalBookings,
            conversionRate: Number(conversionRate),
          });

          // Fetch withdrawals
          const withdrawalsRef = collection(db, 'withdrawals');
          const wq = query(withdrawalsRef, where('affiliateId', '==', user.uid));
          const wSnapshot = await getDocs(wq);
          let pendingTotal = 0;
          const fetchedWithdrawals = wSnapshot.docs.map(doc => {
            const data = doc.data() as any;
            if (data.status === 'pending') {
              pendingTotal += data.amount || 0;
            }
            return { id: doc.id, ...data };
          });
          
          // Sort withdrawals by createdAt descending
          fetchedWithdrawals.sort((a, b) => b.createdAt - a.createdAt);
          setWithdrawals(fetchedWithdrawals);
          setPendingWithdrawalsTotal(pendingTotal);
        }
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
        toast.error('Gagal memuat data affiliate');
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateData();
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!registrationForm.termsAgreed) {
      toast.error('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    setSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        affiliateStatus: 'pending',
        affiliateCode: `AFF-${user.uid.substring(0, 6).toUpperCase()}`,
        affiliateBalance: 0,
        affiliatePendingBalance: 0,
        affiliateDetails: {
          namaKTP: registrationForm.namaKTP,
          nik: registrationForm.nik,
          alamat: registrationForm.alamat,
        },
        affiliateBankDetails: {
          bankName: registrationForm.bankName,
          accountNumber: registrationForm.accountNumber,
          accountName: registrationForm.accountName,
        }
      });
      
      // Send email to admin
      import('../../services/firebase/settings').then(({ getSiteSettings }) => {
        getSiteSettings().then(settings => {
          if (settings?.adminEmail) {
            import('../../services/firebase/email').then(({ sendEmail }) => {
              const adminHtml = `
                <h2>Pendaftaran Affiliate Baru</h2>
                <p>Terdapat pendaftaran affiliate baru dari <strong>${user.displayName || user.email}</strong>.</p>
                <ul>
                  <li>Nama KTP: ${registrationForm.namaKTP}</li>
                  <li>NIK: ${registrationForm.nik}</li>
                  <li>Email: ${user.email}</li>
                </ul>
                <p>Silakan cek dashboard admin untuk menyetujui atau menolak pendaftaran ini.</p>
              `;
              sendEmail(settings.adminEmail!, '[Sikunir Vibes] Pendaftaran Affiliate Baru', adminHtml);
            });
          }
        });
      });
      
      toast.success('Pendaftaran berhasil! Menunggu persetujuan admin.');
      window.location.reload();
    } catch (error) {
      console.error('Error registering affiliate:', error);
      toast.error('Gagal mendaftar program affiliate');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = (path: string) => {
    if (!user?.affiliateCode) return;
    const url = `${window.location.origin}${path}?ref=${user.affiliateCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Link berhasil disalin!');
  };

  const availableBalance = latestUserData?.affiliateBalance || user?.affiliateBalance || 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const amount = parseInt(withdrawAmount.replace(/\D/g, ''));
    if (isNaN(amount) || amount < 100000) {
      toast.error('Minimal penarikan adalah Rp 100.000');
      return;
    }
    
    if (amount > availableBalance) {
      toast.error('Saldo tidak mencukupi');
      return;
    }

    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      toast.error('Silakan lengkapi data rekening bank');
      return;
    }

    setSubmitting(true);
    try {
      const { createWithdrawal } = await import('../../services/firebase/withdrawals');
      await createWithdrawal({
        affiliateId: user.uid,
        amount,
        bankDetails
      });
      
      // Also update user's bank details for future use if they changed
      if (
        user.affiliateBankDetails?.bankName !== bankDetails.bankName ||
        user.affiliateBankDetails?.accountNumber !== bankDetails.accountNumber ||
        user.affiliateBankDetails?.accountName !== bankDetails.accountName
      ) {
        await updateDoc(doc(db, 'users', user.uid), {
          affiliateBankDetails: bankDetails
        });
      }

      setLatestUserData((prev: any) => ({
        ...prev,
        affiliateBalance: availableBalance - amount
      }));
      
      // Send email to admin
      import('../../services/firebase/settings').then(({ getSiteSettings }) => {
        getSiteSettings().then(settings => {
          if (settings?.adminEmail) {
            import('../../services/firebase/email').then(({ sendEmail }) => {
              const adminHtml = `
                <h2>Permintaan Penarikan Dana Affiliate</h2>
                <p>Terdapat permintaan penarikan dana dari affiliate <strong>${user.displayName || user.email}</strong>.</p>
                <ul>
                  <li>Jumlah: Rp ${amount.toLocaleString('id-ID')}</li>
                  <li>Bank: ${bankDetails.bankName}</li>
                  <li>No. Rekening: ${bankDetails.accountNumber}</li>
                  <li>Atas Nama: ${bankDetails.accountName}</li>
                </ul>
                <p>Silakan cek dashboard admin untuk memproses penarikan ini.</p>
              `;
              sendEmail(settings.adminEmail!, '[Sikunir Vibes] Permintaan Penarikan Dana Affiliate', adminHtml);
            });
          }
        });
      });

      toast.success('Permintaan penarikan berhasil dikirim. Menunggu proses admin.');
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setPendingWithdrawalsTotal(prev => prev + amount);
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast.error(error.message || 'Gagal mengirim permintaan penarikan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        affiliateBankDetails: bankDetails
      });
      toast.success('Data rekening bank berhasil disimpan');
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Gagal menyimpan data rekening bank');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  // Registration View
  if (!user.affiliateStatus || user.affiliateStatus === 'none') {
    return (
      <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
        <Helmet>
          <title>Daftar Affiliate | BromoStay</title>
        </Helmet>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-border">
          <div className="bg-primary px-8 py-10 text-white text-center">
            <h1 className="text-3xl font-bold mb-4">Program Affiliate BromoStay</h1>
            <p className="text-primary-light text-lg">Dapatkan komisi menarik dengan mempromosikan penginapan kami.</p>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-bold text-text-primary mb-6">Syarat dan Ketentuan Program Affiliate</h2>
            
            <div className="space-y-4 text-text-secondary mb-8 bg-surface-alt p-6 rounded-xl">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <p><strong>Dilarang Self-Referral:</strong> Affiliate dilarang keras memesan penginapan untuk diri sendiri menggunakan link pribadi. Pelanggaran akan mengakibatkan pembatalan komisi.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <p><strong>Validasi Komisi:</strong> Komisi hanya dianggap sah dan akan masuk ke saldo "Siap Tarik" JIKA tamu telah menyelesaikan masa inap (Check-out). Jika tamu membatalkan pesanan (Cancel), komisi hangus.</p>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <p><strong>Hak Admin:</strong> Admin berhak membatalkan komisi atau menonaktifkan akun affiliate jika ditemukan indikasi kecurangan atau pelanggaran syarat dan ketentuan.</p>
              </div>
              <div className="flex gap-3">
                <Wallet className="w-6 h-6 text-primary flex-shrink-0" />
                <p><strong>Penarikan Saldo:</strong> Minimal penarikan saldo (Withdrawal) adalah Rp 100.000. Penarikan akan diproses ke rekening bank yang terdaftar.</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2">Data Pribadi</h3>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Nama Sesuai KTP *</label>
                    <input
                      type="text"
                      required
                      value={registrationForm.namaKTP}
                      onChange={(e) => setRegistrationForm({...registrationForm, namaKTP: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">NIK *</label>
                    <input
                      type="text"
                      required
                      value={registrationForm.nik}
                      onChange={(e) => setRegistrationForm({...registrationForm, nik: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Alamat Lengkap *</label>
                    <textarea
                      required
                      value={registrationForm.alamat}
                      onChange={(e) => setRegistrationForm({...registrationForm, alamat: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2">Data Rekening Bank</h3>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Nama Bank *</label>
                    <input
                      type="text"
                      required
                      placeholder="BCA / Mandiri / BNI / dll"
                      value={registrationForm.bankName}
                      onChange={(e) => setRegistrationForm({...registrationForm, bankName: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Nomor Rekening *</label>
                    <input
                      type="text"
                      required
                      value={registrationForm.accountNumber}
                      onChange={(e) => setRegistrationForm({...registrationForm, accountNumber: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Nama Pemilik Rekening *</label>
                    <input
                      type="text"
                      required
                      placeholder="Sesuai buku tabungan"
                      value={registrationForm.accountName}
                      onChange={(e) => setRegistrationForm({...registrationForm, accountName: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-border pt-6">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={registrationForm.termsAgreed}
                  onChange={(e) => setRegistrationForm({...registrationForm, termsAgreed: e.target.checked})}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-text-secondary">
                  Saya telah membaca dan menyetujui semua Syarat dan Ketentuan Program Affiliate BromoStay, serta menjamin bahwa data yang saya berikan adalah benar.
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !registrationForm.termsAgreed}
                  className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Daftar Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Pending View
  if (user.affiliateStatus === 'pending') {
    return (
      <div className="min-h-screen bg-surface py-12 px-4 flex items-center justify-center">
        <Helmet>
          <title>Menunggu Persetujuan | BromoStay</title>
        </Helmet>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center border border-border">
          <Clock className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Pendaftaran Sedang Ditinjau</h2>
          <p className="text-text-secondary">
            Terima kasih telah mendaftar. Tim admin kami sedang meninjau pendaftaran Anda. Kami akan segera memprosesnya.
          </p>
        </div>
      </div>
    );
  }

  // Rejected View
  if (user.affiliateStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-surface py-12 px-4 flex items-center justify-center">
        <Helmet>
          <title>Pendaftaran Ditolak | BromoStay</title>
        </Helmet>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center border border-border">
          <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Pendaftaran Ditolak</h2>
          <p className="text-text-secondary">
            Mohon maaf, pendaftaran affiliate Anda tidak dapat kami setujui saat ini.
          </p>
        </div>
      </div>
    );
  }

  // Approved View (Dashboard)
  return (
    <div className="min-h-screen bg-surface py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Affiliate Center | BromoStay</title>
      </Helmet>

      {/* Suspended Modal */}
      {isSuspendedModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Akun Ditangguhkan</h3>
                <p className="text-gray-600 leading-relaxed">
                  Maaf, akun affiliate Anda telah ditangguhkan oleh admin karena melanggar syarat dan ketentuan atau aktivitas yang mencurigakan.
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-sm text-red-700 font-medium">
                Akses ke fitur Affiliate Center dibatasi hingga status akun Anda dipulihkan.
              </div>
              <div className="pt-2">
                <a 
                  href="https://wa.me/6281234567890" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  <MessageCircle className="w-5 h-5" />
                  Hubungi Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 relative">
        
        {/* Mobile Burger Button */}
        <div className="md:hidden flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border border-border shadow-sm">
          <h2 className="font-bold text-text-primary">Menu Affiliate</h2>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-surface-alt rounded-xl text-primary"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-[120] bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-[130] w-72 bg-white shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 md:z-0 md:w-64 md:shadow-none md:bg-transparent
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col md:h-auto">
            <div className="p-6 border-b border-border flex justify-between items-center md:hidden">
              <h2 className="text-xl font-bold text-text-primary">Menu Affiliate</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-surface-alt rounded-full">
                <X className="w-6 h-6 text-text-muted" />
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden md:sticky md:top-24 mt-4 md:mt-0 mx-4 md:mx-0">
              <div className="p-6 border-b border-border hidden md:block">
                <h2 className="text-xl font-bold text-text-primary">Menu Affiliate</h2>
              </div>
              <nav className="p-2 space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'links', label: 'Link Affiliate', icon: LinkIcon },
                  { id: 'orders', label: 'Riwayat Pesanan', icon: ListOrdered },
                  { id: 'withdrawals', label: 'Riwayat Penarikan', icon: History },
                  { id: 'bank', label: 'Akun Bank', icon: Building },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeTab === item.id ? 'bg-primary/10 text-primary font-bold' : 'text-text-secondary hover:bg-surface-alt'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              {activeTab === 'dashboard' && 'Dashboard Affiliate'}
              {activeTab === 'links' && 'Link Affiliate'}
              {activeTab === 'orders' && 'Riwayat Pesanan'}
              {activeTab === 'withdrawals' && 'Riwayat Penarikan'}
              {activeTab === 'bank' && 'Pengaturan Akun Bank'}
            </h1>
            <p className="text-text-secondary mt-1">
              {activeTab === 'dashboard' && 'Pantau performa dan saldo komisi Anda.'}
              {activeTab === 'links' && 'Bagikan link unik Anda untuk mendapatkan komisi.'}
              {activeTab === 'orders' && 'Daftar pesanan dari tamu yang menggunakan link Anda.'}
              {activeTab === 'withdrawals' && 'Riwayat penarikan komisi Anda.'}
              {activeTab === 'bank' && 'Kelola rekening bank untuk penarikan saldo.'}
            </p>
          </div>

          {activeTab === 'dashboard' && (
            <>
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary mb-1">Total Klik</p>
                    <h2 className="text-3xl font-bold text-primary">
                      {stats.totalClicks.toLocaleString('id-ID')}
                    </h2>
                    <p className="text-xs text-text-secondary mt-2">Jumlah klik pada link affiliate Anda.</p>
                  </div>
                  <div className="mt-6 p-3 bg-primary/10 rounded-xl flex items-start gap-2 text-sm text-primary">
                    <TrendingUp className="w-5 h-5 flex-shrink-0" />
                    <p>Terus bagikan link untuk meningkatkan klik!</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary mb-1">Saldo Siap Tarik</p>
                    <h2 className="text-3xl font-bold text-success">
                      Rp {availableBalance.toLocaleString('id-ID')}
                    </h2>
                    {pendingWithdrawalsTotal > 0 && (
                      <p className="text-xs text-warning mt-1">
                        (Ada penarikan tertunda sebesar Rp {pendingWithdrawalsTotal.toLocaleString('id-ID')})
                      </p>
                    )}
                    <p className="text-xs text-text-secondary mt-2">Komisi dari tamu yang sudah check-out.</p>
                  </div>
                  <button 
                    className="mt-6 w-full py-2.5 bg-success text-white font-semibold rounded-xl hover:bg-success-dark transition-colors disabled:opacity-50"
                    disabled={availableBalance < 100000}
                    onClick={() => setIsWithdrawModalOpen(true)}
                  >
                    Tarik Saldo (Min. Rp 100.000)
                  </button>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary mb-1">Saldo Tertunda</p>
                    <h2 className="text-3xl font-bold text-warning">
                      Rp {(user.affiliatePendingBalance || 0).toLocaleString('id-ID')}
                    </h2>
                    <p className="text-xs text-text-secondary mt-2">Komisi dari pesanan yang belum check-out.</p>
                  </div>
                  <div className="mt-6 p-3 bg-warning/10 rounded-xl flex items-start gap-2 text-sm text-warning-dark">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>Saldo ini akan pindah ke "Siap Tarik" setelah tamu selesai menginap.</p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performa Anda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface rounded-xl">
                    <p className="text-sm text-text-secondary mb-1">Total Klik Link</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalClicks}</p>
                  </div>
                  <div className="p-4 bg-surface rounded-xl">
                    <p className="text-sm text-text-secondary mb-1">Total Booking</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalBookings}</p>
                  </div>
                  <div className="p-4 bg-surface rounded-xl">
                    <p className="text-sm text-text-secondary mb-1">Conversion Rate</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.conversionRate}%</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'links' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-bold text-text-primary mb-4">Alat Perang (Link Affiliate)</h3>
              <p className="text-sm text-text-secondary mb-4">
                Bagikan link di bawah ini. Kode unik Anda: <strong className="text-primary">{user.affiliateCode}</strong>
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
                  <div className="flex-1 truncate">
                    <p className="font-medium text-text-primary">Halaman Utama (Home)</p>
                    <p className="text-xs text-text-secondary truncate">{window.location.origin}/?ref={user.affiliateCode}</p>
                  </div>
                  <button 
                    onClick={() => copyLink('/')}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Salin Link"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
                  <div className="flex-1 truncate">
                    <p className="font-medium text-text-primary">Halaman Semua Penginapan</p>
                    <p className="text-xs text-text-secondary truncate">{window.location.origin}/explore?ref={user.affiliateCode}</p>
                  </div>
                  <button 
                    onClick={() => copyLink('/explore')}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Salin Link"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-bold text-lg text-text-primary mb-4">Properti Spesifik:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {properties.map(property => (
                      <div key={property.id} className="flex flex-col border border-border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-40 w-full overflow-hidden relative">
                          <img 
                            src={property.images[0] || 'https://picsum.photos/seed/property/400/300'} 
                            alt={property.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-primary">
                            Komisi: Rp {(property.affiliateCommission || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h5 className="font-bold text-text-primary text-lg mb-1">{property.name}</h5>
                          <p className="text-sm text-text-secondary mb-2 line-clamp-1">
                            {property.amenities?.slice(0, 3).join(' • ') || 'Fasilitas lengkap'}
                          </p>
                          <p className="font-semibold text-primary mb-4">
                            Rp {property.basePrice.toLocaleString('id-ID')} <span className="text-xs text-text-secondary font-normal">/ malam</span>
                          </p>
                          <div className="mt-auto flex gap-2">
                            <button 
                              onClick={() => copyLink(`/properties/${property.id}`)}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors text-sm font-medium"
                            >
                              <Copy className="w-4 h-4" /> Salin Link
                            </button>
                            <button 
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: property.name,
                                    text: `Pesan ${property.name} sekarang!`,
                                    url: `${window.location.origin}/properties/${property.id}?ref=${user.affiliateCode}`
                                  }).catch(console.error);
                                } else {
                                  copyLink(`/properties/${property.id}`);
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors text-sm font-medium"
                            >
                              <Share2 className="w-4 h-4" /> Share
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 p-4 bg-surface-alt rounded-xl text-sm text-text-secondary">
                  <p><strong>Tips:</strong> Anda bisa menambahkan <code className="bg-white px-1 py-0.5 rounded text-primary">?ref={user.affiliateCode}</code> di akhir URL halaman properti manapun di website ini untuk menjadikannya link affiliate Anda.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold text-text-primary">Status Pesanan Tamu</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface text-text-secondary text-sm">
                      <th className="p-4 font-medium">Tamu</th>
                      <th className="p-4 font-medium">Tanggal Inap</th>
                      <th className="p-4 font-medium">Status Pesanan</th>
                      <th className="p-4 font-medium">Komisi</th>
                      <th className="p-4 font-medium">Status Komisi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-text-secondary">
                          Belum ada pesanan dari link Anda. Ayo mulai bagikan link!
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50">
                          <td className="p-4">
                            <p className="font-medium text-text-primary">{booking.guestName}</p>
                            <p className="text-xs text-text-secondary">{booking.id.substring(0, 8)}...</p>
                          </td>
                          <td className="p-4 text-text-secondary">
                            {booking.checkInDate} s/d {booking.checkOutDate}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'PAID' ? 'bg-success/10 text-success-dark' :
                              booking.status === 'COMPLETED' ? 'bg-primary/10 text-primary-dark' :
                              booking.status === 'CANCELLED' ? 'bg-danger/10 text-danger-dark' :
                              'bg-warning/10 text-warning-dark'
                            }`}>
                              {booking.status === 'COMPLETED' ? 'SUKSES' : booking.status === 'PAID' ? 'PEMBAYARAN BERHASIL' : booking.status === 'PENDING' ? 'MENUNGGU PEMBAYARAN' : booking.status}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-text-primary">
                            Rp {(booking.commissionAmount || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.commissionStatus === 'ready' ? 'bg-success/10 text-success-dark' :
                              booking.commissionStatus === 'cancelled' ? 'bg-danger/10 text-danger-dark' :
                              booking.commissionStatus === 'paid' ? 'bg-primary/10 text-primary-dark' :
                              'bg-warning/10 text-warning-dark'
                            }`}>
                              {booking.commissionStatus === 'ready' ? 'Siap Tarik' :
                               booking.commissionStatus === 'pending' ? 'Tertunda' :
                               booking.commissionStatus === 'paid' ? 'Sudah Dibayar' : 'Hangus'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary">Riwayat Penarikan</h3>
                <button 
                  className="px-4 py-2 bg-success text-white text-sm font-semibold rounded-xl hover:bg-success-dark transition-colors disabled:opacity-50"
                  disabled={availableBalance < 100000}
                  onClick={() => setIsWithdrawModalOpen(true)}
                >
                  Tarik Saldo
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface text-text-secondary text-sm">
                      <th className="p-4 font-medium">Tanggal</th>
                      <th className="p-4 font-medium">Jumlah</th>
                      <th className="p-4 font-medium">Rekening Tujuan</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-text-secondary">
                          Belum ada riwayat penarikan saldo.
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50">
                          <td className="p-4 text-text-secondary">
                            {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="p-4 font-medium text-text-primary">
                            Rp {(withdrawal.amount || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-text-primary">{withdrawal.bankDetails?.bankName}</p>
                            <p className="text-xs text-text-secondary">{withdrawal.bankDetails?.accountNumber} - {withdrawal.bankDetails?.accountName}</p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              withdrawal.status === 'completed' ? 'bg-success/10 text-success-dark' :
                              withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                              withdrawal.status === 'rejected' ? 'bg-danger/10 text-danger-dark' :
                              'bg-warning/10 text-warning-dark'
                            }`}>
                              {withdrawal.status === 'completed' ? 'Selesai (Sudah Ditransfer)' :
                               withdrawal.status === 'approved' ? 'Disetujui (Menunggu Transfer)' :
                               withdrawal.status === 'rejected' ? 'Ditolak' : 'Diproses'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border max-w-2xl">
              <h3 className="text-lg font-bold text-text-primary mb-4">Pengaturan Akun Bank</h3>
              <p className="text-sm text-text-secondary mb-6">
                Data rekening bank ini akan digunakan untuk proses penarikan komisi Anda. Pastikan data yang dimasukkan valid.
              </p>
              <form onSubmit={handleSaveBankDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Nama Bank</label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="BCA / Mandiri / BNI / dll"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="1234567890"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Sesuai buku tabungan"
                    required
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Data Rekening'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-primary">Tarik Saldo</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Jumlah Penarikan</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">Rp</span>
                  <input
                    type="text"
                    value={withdrawAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setWithdrawAmount(val ? parseInt(val).toLocaleString('id-ID') : '');
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="100.000"
                    required
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Maksimal: Rp {availableBalance.toLocaleString('id-ID')}
                </p>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-bold text-text-primary mb-3">Rekening Tujuan</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Nama Bank</label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                      placeholder="BCA / Mandiri / BNI / dll"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                      placeholder="1234567890"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Sesuai buku tabungan"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 py-3 bg-surface text-text-primary font-semibold rounded-xl hover:bg-surface-alt transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-success text-white font-semibold rounded-xl hover:bg-success-dark transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Tarik Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateCenter;
