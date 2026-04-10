import React, { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { getAllUsers } from '../../services/firebase/users';
import { Mail, Send, Save, Users } from 'lucide-react';

export function EmailManagement() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<SiteSettings>({});
  
  const [activeTab, setActiveTab] = useState<'templates' | 'broadcast'>('templates');
  
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    getSiteSettings()
      .then((data) => {
        if (data) {
          setFormData(data);
        }
      })
      .catch(error => {
        console.error("Error fetching settings:", error);
        setError("Gagal memuat pengaturan email");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSaveTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await updateSiteSettings(formData);
      setSuccess('Template email berhasil disimpan.');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan template.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) {
      setError('Subjek dan pesan promo harus diisi.');
      return;
    }
    
    if (!formData.smtpHost || !formData.smtpPort || !formData.smtpUser || !formData.smtpPass) {
      setError('Pengaturan SMTP belum lengkap. Silakan lengkapi di menu Pengaturan.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const users = await getAllUsers();
      const emails = users.map(u => u.email).filter(Boolean);

      if (emails.length === 0) {
        throw new Error('Tidak ada pengguna untuk dikirimi email.');
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emails,
          subject: broadcastSubject,
          html: broadcastMessage,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          smtpUser: formData.smtpUser,
          smtpPass: formData.smtpPass,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim email masal.');
      }

      setSuccess(`Email promo masal berhasil dikirim ke ${emails.length} pengguna!`);
      setBroadcastSubject('');
      setBroadcastMessage('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email masal.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillTemplate = (type: string) => {
    switch (type) {
      case 'registration':
        setFormData(prev => ({
          ...prev,
          emailTemplateRegistration: `<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #2563eb;">Selamat Datang di Sikunir Vibes, {{userName}}!</h2>
    <p>Terima kasih telah mendaftar. Akun Anda telah berhasil dibuat.</p>
    <p>Silakan jelajahi berbagai penginapan menarik di aplikasi kami dengan pemandangan sunrise terbaik di Dieng.</p>
    <div style="margin: 30px 0;">
      <a href="{{appUrl}}/explore" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Jelajah Penginapan</a>
    </div>
    <p>Salam hangat,<br/>Tim Sikunir Vibes</p>
  </div>
</body>
</html>`
        }));
        break;
      case 'booking':
        setFormData(prev => ({
          ...prev,
          emailTemplateBooking: `<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #2563eb;">Konfirmasi Pesanan #{{bookingId}}</h2>
    <p>Halo {{userName}},</p>
    <p>Pesanan Anda untuk <strong>{{propertyName}}</strong> telah kami terima.</p>
    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li><strong>Check-in:</strong> {{checkIn}}</li>
        <li><strong>Check-out:</strong> {{checkOut}}</li>
        <li><strong>Total Bayar:</strong> Rp {{totalAmount}}</li>
      </ul>
    </div>
    <p>Silakan lakukan pembayaran agar pesanan Anda dapat segera diproses.</p>
    <div style="margin: 30px 0;">
      <a href="{{appUrl}}/cek-booking" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Lihat Detail Pesanan</a>
    </div>
    <p>Terima kasih!</p>
  </div>
</body>
</html>`
        }));
        break;
      case 'payment':
        setFormData(prev => ({
          ...prev,
          emailTemplatePayment: `<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #059669;">Pembayaran Berhasil!</h2>
    <p>Halo {{userName}},</p>
    <p>Pembayaran untuk pesanan <strong>#{{bookingId}}</strong> telah berhasil kami verifikasi.</p>
    <p>Status pesanan Anda saat ini adalah: <strong style="color: #059669;">{{status}}</strong>.</p>
    <div style="margin: 30px 0;">
      <a href="{{appUrl}}/cek-booking" style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Cek Status Pesanan</a>
    </div>
    <p>Terima kasih telah mempercayakan akomodasi Anda kepada kami!</p>
  </div>
</body>
</html>`
        }));
        break;
      case 'promo':
        setFormData(prev => ({
          ...prev,
          emailTemplatePromo: `<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #d97706;">Promo Spesial Untuk Anda!</h2>
    <p>Halo {{userName}},</p>
    <p>Dapatkan diskon menarik untuk pemesanan penginapan bulan ini di Sikunir Vibes.</p>
    <div style="background-color: #fffbeb; border: 2px dashed #d97706; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">Gunakan kode voucher:</p>
      <h3 style="margin: 5px 0; font-size: 24px; color: #d97706; letter-spacing: 2px;">{{voucherCode}}</h3>
    </div>
    <div style="margin: 30px 0; text-align: center;">
      <a href="{{appUrl}}/explore" style="background-color: #d97706; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Pesan Sekarang</a>
    </div>
    <p style="font-size: 12px; color: #666; text-align: center;">*Syarat dan ketentuan berlaku</p>
  </div>
</body>
</html>`
        }));
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Email</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 border border-green-100">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Template Email
          </div>
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'broadcast'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Kirim Promo Masal
          </div>
        </button>
      </div>

      {activeTab === 'templates' ? (
        <form onSubmit={handleSaveTemplates} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
          
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pengaturan Email (SMTP)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={formData.smtpHost || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, smtpHost: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="text"
                value={formData.smtpPort || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, smtpPort: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="587"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username
              </label>
              <input
                type="text"
                value={formData.smtpUser || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, smtpUser: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <input
                type="password"
                value={formData.smtpPass || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, smtpPass: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Registration Template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">
                Email Registrasi
              </label>
              <button 
                type="button" 
                onClick={() => fillTemplate('registration')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Gunakan Template Default
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Dikirim saat pengguna baru berhasil membuat akun. Variabel: {'{{userName}}'}, {'{{userEmail}}'}</p>
            <textarea
              value={formData.emailTemplateRegistration || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, emailTemplateRegistration: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
              placeholder="<html><body>...</body></html>"
            />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Booking Template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">
                Email Pesanan Baru (Booking)
              </label>
              <button 
                type="button" 
                onClick={() => fillTemplate('booking')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Gunakan Template Default
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Dikirim saat pengguna membuat pesanan baru. Variabel: {'{{userName}}'}, {'{{bookingId}}'}, {'{{propertyName}}'}, {'{{checkIn}}'}, {'{{checkOut}}'}, {'{{totalAmount}}'}</p>
            <textarea
              value={formData.emailTemplateBooking || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, emailTemplateBooking: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
              placeholder="<html><body>...</body></html>"
            />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Payment Info Template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">
                Email Informasi Pembayaran
              </label>
              <button 
                type="button" 
                onClick={() => fillTemplate('payment')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Gunakan Template Default
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Dikirim saat pembayaran berhasil atau status pesanan berubah. Variabel: {'{{userName}}'}, {'{{bookingId}}'}, {'{{status}}'}</p>
            <textarea
              value={formData.emailTemplatePayment || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, emailTemplatePayment: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
              placeholder="<html><body>...</body></html>"
            />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Promo Template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">
                Email Promo Default
              </label>
              <button 
                type="button" 
                onClick={() => fillTemplate('promo')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Gunakan Template Default
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Template dasar untuk pengiriman promo masal. Variabel: {'{{userName}}'}, {'{{voucherCode}}'}</p>
            <textarea
              value={formData.emailTemplatePromo || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, emailTemplatePromo: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
              placeholder="<html><body>...</body></html>"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Menyimpan...' : 'Simpan Template'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSendBroadcast} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6">
            <p className="font-bold mb-1">Informasi Broadcast</p>
            <p>Email ini akan dikirimkan ke <strong>semua pengguna</strong> yang terdaftar di aplikasi. Pastikan isi email sudah benar sebelum mengirim.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Subjek Email
            </label>
            <input
              type="text"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Contoh: Promo Spesial Liburan Akhir Tahun!"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Isi Pesan (HTML)
            </label>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
              placeholder="<html><body>...</body></html>"
              required
            />
            <div className="mt-2 flex justify-end">
              <button 
                type="button"
                onClick={() => setBroadcastMessage(formData.emailTemplatePromo || '')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Salin dari Template Promo Default
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-100 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Mengirim...' : 'Kirim ke Semua Pengguna'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
