import React, { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings, SiteSettings, QnAItem } from '../../services/firebase/settings';
import { ImageUpload } from '../../components/common/ImageUpload';
import { Plus, Trash2, Download } from 'lucide-react';

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<SiteSettings>({
    heroBannerUrl: '',
    logoUrl: '',
    profile: '',
    rules: '',
    contactPhone: '',
    contactName: '',
    socialTiktok: '',
    socialYoutube: '',
    socialInstagram: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    adminEmail: '',
    emailTemplateInvoice: '',
    emailTemplatePromo: '',
    emailTemplateBooking: '',
    emailTemplatePayment: '',
    primaryColor: '#2563eb', // Default blue-600
    qna: [],
  });

  useEffect(() => {
    getSiteSettings()
      .then((data) => {
        if (data) {
          setFormData({
            heroBannerUrl: data.heroBannerUrl || '',
            logoUrl: data.logoUrl || '',
            profile: data.profile || '',
            rules: data.rules || '',
            contactPhone: data.contactPhone || '',
            contactName: data.contactName || '',
            socialTiktok: data.socialTiktok || '',
            socialYoutube: data.socialYoutube || '',
            socialInstagram: data.socialInstagram || '',
            smtpHost: data.smtpHost || '',
            smtpPort: data.smtpPort || '',
            smtpUser: data.smtpUser || '',
            smtpPass: data.smtpPass || '',
            adminEmail: data.adminEmail || '',
            emailTemplateInvoice: data.emailTemplateInvoice || '',
            emailTemplatePromo: data.emailTemplatePromo || '',
            emailTemplateBooking: data.emailTemplateBooking || '',
            emailTemplatePayment: data.emailTemplatePayment || '',
            primaryColor: data.primaryColor || '#2563eb',
            qna: data.qna || [],
          });
        }
      })
      .catch(error => {
        console.error("Error fetching settings:", error);
        setError("Gagal memuat pengaturan");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAddQnA = () => {
    setFormData(prev => ({
      ...prev,
      qna: [...(prev.qna || []), { question: '', answer: '' }]
    }));
  };

  const handleRemoveQnA = (index: number) => {
    setFormData(prev => {
      const newQna = [...(prev.qna || [])];
      newQna.splice(index, 1);
      return { ...prev, qna: newQna };
    });
  };

  const handleQnAChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFormData(prev => {
      const newQna = [...(prev.qna || [])];
      newQna[index] = { ...newQna[index], [field]: value };
      return { ...prev, qna: newQna };
    });
  };

  const loadDefaultQnA = () => {
    const defaultQnA: QnAItem[] = [
      {
        question: "Apakah bisa check-in lebih awal (early check-in)?",
        answer: "Early check-in tergantung pada ketersediaan kamar pada hari tersebut. Silakan hubungi kami H-1 sebelum kedatangan untuk memastikan ketersediaannya. Mungkin ada biaya tambahan yang berlaku."
      },
      {
        question: "Apakah harga sudah termasuk sarapan?",
        answer: "Ya, sebagian besar paket penginapan kami sudah termasuk sarapan gratis untuk 2 orang per kamar. Silakan cek detail fasilitas pada masing-masing tipe kamar."
      },
      {
        question: "Bagaimana cara menuju ke Sikunir Vibes?",
        answer: "Anda dapat menggunakan kendaraan pribadi atau menyewa jeep. Kami menyediakan layanan antar-jemput dari titik kumpul tertentu dengan biaya tambahan. Silakan hubungi admin untuk informasi lebih lanjut."
      },
      {
        question: "Apakah menyediakan layanan sewa Jeep untuk ke Bukit Sikunir?",
        answer: "Tentu saja! Kami menyediakan layanan sewa Jeep untuk menikmati matahari terbit di Bukit Sikunir dan menjelajahi area Dieng lainnya. Anda dapat memesannya melalui menu 'Rental Jeep' atau menghubungi admin."
      },
      {
        question: "Apakah ada fasilitas air panas di kamar mandi?",
        answer: "Ya, semua kamar mandi di Sikunir Vibes dilengkapi dengan fasilitas air panas/water heater untuk kenyamanan Anda di cuaca dingin Dieng."
      },
      {
        question: "Bagaimana kebijakan pembatalan (cancellation policy)?",
        answer: "Pembatalan yang dilakukan H-7 sebelum tanggal check-in akan mendapatkan pengembalian dana 100%. Pembatalan H-3 akan dikenakan biaya 50%. Pembatalan kurang dari H-3 tidak ada pengembalian dana."
      }
    ];

    if (window.confirm("Apakah Anda yakin ingin memuat QnA default? Ini akan menimpa QnA yang sudah ada.")) {
      setFormData(prev => ({
        ...prev,
        qna: defaultQnA
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await updateSiteSettings(formData);
      setSuccess('Pengaturan berhasil disimpan.');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan Umum</h1>

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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo Website
          </label>
          <ImageUpload
            path="settings"
            value={formData.logoUrl || ''}
            onChange={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
            label="Unggah Logo"
          />
          <p className="mt-2 text-xs text-gray-500">
            Gambar ini akan ditampilkan sebagai logo di navbar. Disarankan menggunakan format PNG transparan.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100"></div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Banner Beranda
          </label>
          <ImageUpload
            path="settings"
            value={formData.heroBannerUrl || ''}
            onChange={(url) => setFormData(prev => ({ ...prev, heroBannerUrl: url }))}
            label="Unggah Banner"
          />
          <p className="mt-2 text-xs text-gray-500">
            Gambar ini akan ditampilkan sebagai background pada bagian atas halaman beranda.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100"></div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warna Utama (Primary Color)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={formData.primaryColor || '#2563eb'}
              onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
              className="h-10 w-20 cursor-pointer rounded border border-gray-300"
            />
            <input
              type="text"
              value={formData.primaryColor || '#2563eb'}
              onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="#2563eb"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Warna ini akan digunakan untuk tombol utama dan elemen penting lainnya.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100"></div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profil Penginapan
          </label>
          <textarea
            value={formData.profile || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Deskripsi profil penginapan, sejarah, visi misi, dll."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Peraturan Menginap
          </label>
          <textarea
            value={formData.rules || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Peraturan yang harus dipatuhi tamu (misal: dilarang merokok, jam malam, dll)."
          />
        </div>

        <div className="pt-4 border-t border-gray-100"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kontak Admin
            </label>
            <input
              type="text"
              value={formData.contactName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Contoh: Admin Sikunir Vibes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor WhatsApp Admin
            </label>
            <input
              type="text"
              value={formData.contactPhone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Contoh: 6281234567890"
            />
            <p className="mt-2 text-xs text-gray-500">
              Gunakan format 62 (tanpa + atau 0 di depan).
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Admin (Untuk Notifikasi)
            </label>
            <input
              type="email"
              value={formData.adminEmail || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Contoh: admin@sikunirvibes.com"
            />
            <p className="mt-2 text-xs text-gray-500">
              Email ini akan menerima notifikasi saat ada booking baru, pendaftaran affiliate, penarikan dana, dan pembatalan.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100"></div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">Social Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram URL
            </label>
            <input
              type="url"
              value={formData.socialInstagram || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, socialInstagram: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </label>
            <input
              type="url"
              value={formData.socialYoutube || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, socialYoutube: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="https://youtube.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TikTok URL
            </label>
            <input
              type="url"
              value={formData.socialTiktok || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, socialTiktok: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="https://tiktok.com/..."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100"></div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">Template Email</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Email Konfirmasi Pesanan (Booking)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Gunakan placeholder: {'{{bookingId}}, {{userName}}, {{propertyName}}, {{checkIn}}, {{checkOut}}, {{basePrice}}, {{tourPackagePrice}}, {{addOnsPrice}}, {{discountAmount}}, {{totalAmount}}'}
            </p>
            <textarea
              value={formData.emailTemplateBooking || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, emailTemplateBooking: e.target.value }))}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm"
              placeholder={`<h2>Konfirmasi Pesanan</h2>
<p>Halo {{userName}},</p>
<p>Terima kasih telah melakukan pemesanan. Berikut adalah detail pesanan Anda:</p>
<div class="order-details">
  <div class="order-item"><span>ID Booking:</span> <strong>{{bookingId}}</strong></div>
  <div class="order-item"><span>Properti:</span> <strong>{{propertyName}}</strong></div>
  <div class="order-item"><span>Check-in:</span> <strong>{{checkIn}}</strong></div>
  <div class="order-item"><span>Check-out:</span> <strong>{{checkOut}}</strong></div>
  <div class="order-item"><span>Harga Dasar:</span> <strong>Rp {{basePrice}}</strong></div>
  <div class="order-item"><span>Paket Wisata:</span> <strong>Rp {{tourPackagePrice}}</strong></div>
  <div class="order-item"><span>Layanan Tambahan:</span> <strong>Rp {{addOnsPrice}}</strong></div>
  <div class="order-item"><span>Diskon:</span> <strong>- Rp {{discountAmount}}</strong></div>
  <div class="order-total"><span>Total Pembayaran:</span> <strong>Rp {{totalAmount}}</strong></div>
</div>
<div style="text-align: center;">
  <a href="{{appUrl}}/cek-booking?id={{bookingId}}" class="button">Lihat Detail Pesanan</a>
</div>`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Email Konfirmasi Pembayaran
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Gunakan placeholder: {'{{bookingId}}, {{userName}}, {{propertyName}}, {{totalAmount}}'}
            </p>
            <textarea
              value={formData.emailTemplatePayment || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, emailTemplatePayment: e.target.value }))}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm"
              placeholder={`<h2>Konfirmasi Pembayaran</h2>
<p>Halo {{userName}},</p>
<p>Pembayaran untuk pesanan Anda telah kami terima.</p>
<div class="order-details">
  <div class="order-item"><span>ID Booking:</span> <strong>{{bookingId}}</strong></div>
  <div class="order-item"><span>Properti:</span> <strong>{{propertyName}}</strong></div>
  <div class="order-total"><span>Total Dibayar:</span> <strong>Rp {{totalAmount}}</strong></div>
</div>
<div style="text-align: center;">
  <a href="{{appUrl}}/cek-booking?id={{bookingId}}" class="button">Lihat Detail Pesanan</a>
</div>`}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100"></div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Tanya Jawab (QnA)</h2>
          <button
            type="button"
            onClick={loadDefaultQnA}
            className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
          >
            <Download className="w-4 h-4" /> Load Default QnA
          </button>
        </div>
        <div className="space-y-4">
          {(formData.qna || []).map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-xl space-y-4 relative">
              <button
                type="button"
                onClick={() => handleRemoveQnA(index)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => handleQnAChange(index, 'question', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-10"
                  placeholder="Contoh: Apakah bisa check-in lebih awal?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban</label>
                <textarea
                  value={item.answer}
                  onChange={(e) => handleQnAChange(index, 'answer', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Jawaban untuk pertanyaan di atas..."
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddQnA}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" /> Tambah QnA
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
