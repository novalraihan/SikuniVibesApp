import React, { useState, useEffect, useRef } from 'react';
import { getSiteSettings, updateSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { getAllUsers } from '../../services/firebase/users';
import { createNotification } from '../../services/firebase/notifications';
import { sendEmail } from '../../services/firebase/email';
import { 
  Mail, Send, Save, Users, FileText, Copy, Download, 
  MessageCircle, Check, Bell, X, Settings, Layout 
} from 'lucide-react';
import { User } from '../../types';
import { toast } from 'sonner';

const MESSAGE_TEMPLATES = [
  {
    id: 'booking_info',
    name: 'Informasi Booking',
    content: `Halo [Nama Tamu],

Terima kasih telah melakukan pemesanan di [Nama Properti]. Berikut adalah detail pesanan Anda:

ID Booking: [ID Booking]
Tanggal Check-in: [Check-in]
Tanggal Check-out: [Check-out]
Total Pembayaran: Rp [Total]

Silakan tunjukkan pesan ini atau bukti booking saat kedatangan.
Jika ada pertanyaan, jangan ragu untuk menghubungi kami.

Salam hangat,
Tim [Nama Properti]`,
  },
  {
    id: 'cancellation',
    name: 'Pembatalan Booking',
    content: `Halo [Nama Tamu],

Kami menginformasikan bahwa pesanan Anda dengan ID [ID Booking] di [Nama Properti] telah dibatalkan.

Alasan pembatalan: [Alasan]

Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi kami.

Salam hangat,
Tim [Nama Properti]`,
  },
  {
    id: 'refund',
    name: 'Pengembalian Dana (Refund)',
    content: `Halo [Nama Tamu],

Terkait pembatalan pesanan Anda dengan ID [ID Booking], kami ingin menginformasikan bahwa proses pengembalian dana (refund) sebesar Rp [Total Refund] sedang diproses.

Dana akan masuk ke rekening Anda dalam waktu [Estimasi Waktu] hari kerja.

Terima kasih atas pengertiannya.

Salam hangat,
Tim [Nama Properti]`,
  },
  {
    id: 'rules',
    name: 'Peraturan Booking & Menginap',
    content: `Halo [Nama Tamu],

Menyambut kedatangan Anda di [Nama Properti], berikut adalah beberapa peraturan yang perlu diperhatikan:

1. Waktu Check-in adalah pukul 14:00 dan Check-out pukul 12:00.
2. Dilarang membawa hewan peliharaan (kecuali ada izin khusus).
3. Dilarang merokok di dalam ruangan.
4. Harap menjaga ketenangan di atas pukul 22:00.

Terima kasih atas kerjasamanya. Kami menantikan kedatangan Anda!

Salam hangat,
Tim [Nama Properti]`,
  }
];

export function CommunicationCenter() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'email-settings' | 'email-templates' | 'broadcast' | 'message-templates' | 'home-popup'>('email-settings');
  
  const [settings, setSettings] = useState<SiteSettings>({
    homePopup: {
      enabled: false,
      showOnce: true,
      imageUrl: '',
      title: '',
      description: '',
      buttonText: 'Lihat Sekarang',
      buttonUrl: ''
    }
  });
  const [users, setUsers] = useState<User[]>([]);
  
  // Broadcast State
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  
  // Message Template State
  const [selectedMsgTemplate, setSelectedMsgTemplate] = useState(MESSAGE_TEMPLATES[0]);
  const [msgContent, setMsgContent] = useState(MESSAGE_TEMPLATES[0].content);
  const [copied, setCopied] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [notifType, setNotifType] = useState<'promo' | 'system'>('promo');
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsData, usersData] = await Promise.all([
          getSiteSettings(),
          getAllUsers()
        ]);
        if (settingsData) setSettings(settingsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data komunikasi");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateSiteSettings(settings);
      toast.success('Pengaturan berhasil disimpan');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) {
      toast.error('Subjek dan pesan harus diisi');
      return;
    }
    
    setSubmitting(true);
    try {
      const emails = users.map(u => u.email).filter(Boolean);
      if (emails.length === 0) throw new Error('Tidak ada pengguna untuk dikirimi email');

      // Send emails one by one to avoid timeout or use a batch service if available
      // For now, we use our sendEmail helper which calls the backend
      const promises = emails.map(email => 
        sendEmail(email, broadcastSubject, broadcastMessage)
      );
      
      await Promise.all(promises);
      toast.success(`Email broadcast berhasil dikirim ke ${emails.length} pengguna!`);
      setBroadcastSubject('');
      setBroadcastMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  const fillEmailTemplate = (type: string) => {
    const templates: Record<string, string> = {
      registration: `<html>
<head>
  <style>
    .button { background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
  </style>
</head>
<body>
  <h2>Selamat Datang di {{siteName}}, {{userName}}!</h2>
  <p>Terima kasih telah mendaftar. Akun Anda telah berhasil dibuat.</p>
  <p>Silakan jelajahi berbagai penginapan menarik di aplikasi kami.</p>
  <div style="text-align: center; margin-top: 30px;">
    <a href="{{appUrl}}/explore" class="button">Jelajah Penginapan</a>
  </div>
  <br/>
  <p>Salam hangat,</p>
  <p>Tim {{siteName}}</p>
</body>
</html>`,
      booking: `<html>
<head>
  <style>
    .button { background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
    .order-details { background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .order-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .order-total { border-top: 1px solid #e5e7eb; margin-top: 12px; pt: 12px; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <h2>Konfirmasi Pesanan #{{bookingId}}</h2>
  <p>Halo {{userName}},</p>
  <p>Pesanan Anda untuk <strong>{{propertyName}}</strong> telah kami terima.</p>
  <div class="order-details">
    <div class="order-item"><span>Check-in:</span> <span>{{checkIn}}</span></div>
    <div class="order-item"><span>Check-out:</span> <span>{{checkOut}}</span></div>
    <div class="order-item"><span>Total Bayar:</span> <span>Rp {{totalAmount}}</span></div>
  </div>
  <p>Silakan lakukan pembayaran agar pesanan Anda dapat segera diproses.</p>
  <div style="text-align: center; margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
    <a href="{{appUrl}}/cek-booking" class="button">Cek Status & Bayar</a>
    <a href="{{appUrl}}/explore" class="button" style="background-color: #4b5563;">Lihat Properti Lain</a>
  </div>
</body>
</html>`,
      payment: `<html>
<head>
  <style>
    .button { background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
  </style>
</head>
<body>
  <h2>Informasi Pembayaran Diterima</h2>
  <p>Halo {{userName}},</p>
  <p>Pembayaran untuk pesanan <strong>#{{bookingId}}</strong> telah berhasil kami verifikasi.</p>
  <p>Status pesanan Anda saat ini adalah: <strong>{{status}}</strong>.</p>
  <p>Terima kasih telah mempercayakan akomodasi Anda kepada kami!</p>
  <div style="text-align: center; margin-top: 30px;">
    <a href="{{appUrl}}/profile" class="button">Lihat Riwayat Pesanan</a>
  </div>
</body>
</html>`,
      promo: `<html>
<head>
  <style>
    .button { background-color: #FF5A1F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
  </style>
</head>
<body>
  <h2>Promo Spesial Untuk Anda!</h2>
  <p>Halo {{userName}},</p>
  <p>Dapatkan diskon menarik untuk pemesanan penginapan bulan ini.</p>
  <p>Gunakan kode voucher: <strong style="font-size: 20px; color: #FF5A1F;">{{voucherCode}}</strong></p>
  <div style="text-align: center; margin-top: 30px;">
    <a href="{{appUrl}}/explore" class="button">Lihat Promo Sekarang</a>
  </div>
</body>
</html>`
    };

    if (templates[type]) {
      const field = `emailTemplate${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof SiteSettings;
      setSettings(prev => ({ ...prev, [field]: templates[type] }));
    }
  };

  const handleCopyMsg = () => {
    navigator.clipboard.writeText(msgContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    const element = pdfRef.current;
    if (!element) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: 15,
      filename: `Surat_${selectedMsgTemplate.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleSendNotif = async () => {
    if (!msgContent.trim()) return toast.error('Pesan tidak boleh kosong');
    setSubmitting(true);
    try {
      if (selectedUser === 'all') {
        await Promise.all(users.map(u => createNotification({
          userId: u.uid,
          title: selectedMsgTemplate.name,
          message: msgContent,
          type: notifType,
          isRead: false
        })));
        toast.success(`Notifikasi dikirim ke ${users.length} pengguna`);
      } else {
        await createNotification({
          userId: selectedUser,
          title: selectedMsgTemplate.name,
          message: msgContent,
          type: notifType,
          isRead: false
        });
        toast.success('Notifikasi berhasil dikirim');
      }
      setShowNotifModal(false);
    } catch (error) {
      toast.error('Gagal mengirim notifikasi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Pusat Komunikasi & Pengaturan</h1>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('email-settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'email-settings' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" /> SMTP
          </button>
          <button
            onClick={() => setActiveTab('email-templates')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'email-templates' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Layout className="w-4 h-4" /> Template Email
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'broadcast' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" /> Broadcast
          </button>
          <button
            onClick={() => setActiveTab('message-templates')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'message-templates' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Template Pesan
          </button>
          <button
            onClick={() => setActiveTab('home-popup')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'home-popup' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" /> Popup Home
          </button>
        </div>
      </div>

      {activeTab === 'home-popup' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pengaturan Popup Homepage</h2>
              <p className="text-sm text-gray-500">Konfigurasi banner popup yang muncul saat pengguna mengakses halaman utama</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">Aktifkan Popup</p>
                  <p className="text-xs text-gray-500">Tampilkan popup di halaman utama</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.homePopup?.enabled || false}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      homePopup: { ...(prev.homePopup || { enabled: false, showOnce: true, imageUrl: '', title: '', description: '', buttonText: 'Lihat Sekarang', buttonUrl: '' }), enabled: e.target.checked }
                    }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Frekuensi Tampil</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      homePopup: { ...(prev.homePopup || { enabled: false, showOnce: true, imageUrl: '', title: '', description: '', buttonText: 'Lihat Sekarang', buttonUrl: '' }), showOnce: true }
                    }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      settings.homePopup?.showOnce 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-bold text-sm text-gray-900">Sekali Saja</p>
                    <p className="text-[10px] text-gray-500">Hanya muncul sekali per sesi user</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      homePopup: { ...(prev.homePopup || { enabled: false, showOnce: true, imageUrl: '', title: '', description: '', buttonText: 'Lihat Sekarang', buttonUrl: '' }), showOnce: false }
                    }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      settings.homePopup && !settings.homePopup.showOnce 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-bold text-sm text-gray-900">Selalu</p>
                    <p className="text-[10px] text-gray-500">Muncul setiap kali akses home</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">URL Gambar</label>
                <input
                  type="text"
                  value={settings.homePopup?.imageUrl || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    homePopup: { ...(prev.homePopup || { enabled: false, showOnce: true, imageUrl: '', title: '', description: '', buttonText: 'Lihat Sekarang', buttonUrl: '' }), imageUrl: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Judul Popup</label>
                <input
                  type="text"
                  value={settings.homePopup?.title || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    homePopup: { ...(prev.homePopup || { enabled: false, showOnce: true, imageUrl: '', title: '', description: '', buttonText: 'Lihat Sekarang', buttonUrl: '' }), title: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Promo Spesial Hari Ini!"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea
                  value={settings.homePopup?.description || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    homePopup: { ...(prev.homePopup || { enabled: false, showOnce: true, imageUrl: '', title: '', description: '', buttonText: 'Lihat Sekarang', buttonUrl: '' }), description: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Dapatkan diskon hingga 50% untuk..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Teks Tombol</label>
                  <input
                    type="text"
                    value={settings.homePopup?.buttonText || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      homePopup: { ...(prev.homePopup || { enabled: false, showOnce: true, imageUrl: '', title: '', description: '', buttonText: 'Lihat Sekarang', buttonUrl: '' }), buttonText: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Lihat Sekarang"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">URL Tombol</label>
                  <input
                    type="text"
                    value={settings.homePopup?.buttonUrl || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      homePopup: { ...(prev.homePopup || { enabled: false, showOnce: true, imageUrl: '', title: '', description: '', buttonText: 'Lihat Sekarang', buttonUrl: '' }), buttonUrl: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="/promos"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> Simpan Pengaturan Popup
            </button>
          </div>
        </form>
      )}

      {activeTab === 'email-settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Konfigurasi SMTP</h2>
              <p className="text-sm text-gray-500">Pengaturan server untuk pengiriman email otomatis</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SMTP Host</label>
              <input
                type="text"
                value={settings.smtpHost || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SMTP Port</label>
              <input
                type="text"
                value={settings.smtpPort || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SMTP Username</label>
              <input
                type="text"
                value={settings.smtpUser || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SMTP Password</label>
              <input
                type="password"
                value={settings.smtpPass || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Simpan Konfigurasi
            </button>
          </div>
        </form>
      )}

      {activeTab === 'email-templates' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'registration', label: 'Email Registrasi', field: 'emailTemplateRegistration' },
              { id: 'booking', label: 'Email Pesanan Baru', field: 'emailTemplateBooking' },
              { id: 'payment', label: 'Email Pembayaran', field: 'emailTemplatePayment' },
              { id: 'promo', label: 'Email Promo Default', field: 'emailTemplatePromo' }
            ].map((tmpl) => (
              <div key={tmpl.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{tmpl.label}</h3>
                  <button 
                    type="button" 
                    onClick={() => fillEmailTemplate(tmpl.id)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Gunakan Default
                  </button>
                </div>
                <textarea
                  value={(settings as any)[tmpl.field] || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, [tmpl.field]: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none font-mono text-xs resize-none"
                  placeholder="Isi konten HTML..."
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> Simpan Semua Template
            </button>
          </div>
        </form>
      )}

      {activeTab === 'broadcast' && (
        <form onSubmit={handleSendBroadcast} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <p className="text-sm text-primary font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> Broadcast ke {users.length} pengguna terdaftar
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subjek Email</label>
            <input
              type="text"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="Contoh: Promo Spesial Akhir Tahun!"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Konten Email (HTML)</label>
              <button 
                type="button"
                onClick={() => setBroadcastMessage(settings.emailTemplatePromo || '')}
                className="text-xs text-primary hover:underline"
              >
                Salin dari Template Promo
              </button>
            </div>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none font-mono text-xs resize-none"
              placeholder="<html><body>...</body></html>"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
            >
              <Send className="w-5 h-5" /> Kirim Sekarang
            </button>
          </div>
        </form>
      )}

      {activeTab === 'message-templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Daftar Template</h3>
              <div className="space-y-2">
                {MESSAGE_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedMsgTemplate(t);
                      setMsgContent(t.content);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedMsgTemplate.id === t.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-bold text-gray-900">Editor Pesan</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleCopyMsg} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all" title="Salin Teks">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(msgContent)}`, '_blank')} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all" title="Kirim WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button onClick={handleDownloadPDF} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all" title="Unduh PDF">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowNotifModal(true)} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-all flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" /> Kirim Notifikasi
                  </button>
                </div>
              </div>
              <textarea
                value={msgContent}
                onChange={(e) => setMsgContent(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none font-sans text-sm resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Kirim Notifikasi</h2>
              <button onClick={() => setShowNotifModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Penerima</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="all">Semua Pengguna ({users.length})</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>{u.displayName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Notifikasi</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as 'promo' | 'system')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="promo">Promo / Penawaran</option>
                  <option value="system">Peringatan / Sistem</option>
                </select>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Judul Notifikasi:</p>
                <p className="text-sm font-bold text-gray-900">{selectedMsgTemplate.name}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowNotifModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all">Batal</button>
              <button onClick={handleSendNotif} disabled={submitting} className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20">
                {submitting ? 'Mengirim...' : 'Kirim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF content */}
      <div className="hidden">
        <div ref={pdfRef} className="p-10 bg-white font-sans text-gray-900">
          <div className="mb-8 border-b-2 border-gray-200 pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider">{selectedMsgTemplate.name}</h1>
            <p className="text-gray-500 mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed text-base">
            {msgContent}
          </div>
          <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500 text-center">
            Dokumen ini digenerate secara otomatis oleh sistem ${settings.siteName || 'Sikunir Vibes'}.
          </div>
        </div>
      </div>
    </div>
  );
}
