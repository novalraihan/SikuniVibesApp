import React, { useState, useEffect } from 'react';
import { TopBar } from '../../components/layout/TopBar';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { MessageCircle, HelpCircle, AlertCircle, Phone, Mail, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export function HelpCenter() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [openQna, setOpenQna] = useState<number | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  const handleChatAdmin = () => {
    if (settings?.contactPhone) {
      const phone = settings.contactPhone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=Halo%20Admin%20Sikunir%20Vibes,%20saya%20butuh%20bantuan.`, '_blank');
    }
  };

  const toggleQna = (index: number) => {
    setOpenQna(openQna === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Pusat Bantuan" />
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pusat Bantuan</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan Anda atau hubungi tim kami untuk bantuan lebih lanjut.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* QnA Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Pertanyaan Umum (FAQ)</h2>
              </div>
              
              <div className="space-y-4">
                {settings?.qna && settings.qna.length > 0 ? (
                  settings.qna.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleQna(index)}
                        className="w-full flex justify-between items-center p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-semibold text-gray-900">{item.question}</span>
                        {openQna === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {openQna === index && (
                        <div className="p-4 bg-white text-gray-600 border-t border-gray-200">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Belum ada pertanyaan umum yang ditambahkan.</p>
                )}
              </div>
            </section>

            {/* Solusi Masalah */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Solusi Masalah</h2>
              </div>
              
              <div className="space-y-6">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Pembatalan Booking</h3>
                  <p className="text-gray-600 mb-2">
                    Jika Anda ingin membatalkan booking, silakan hubungi admin kami melalui WhatsApp. Pembatalan dapat dilakukan dengan syarat dan ketentuan yang berlaku.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                    <li>Pembatalan H-7: Pengembalian dana 100%</li>
                    <li>Pembatalan H-3: Pengembalian dana 50%</li>
                    <li>Pembatalan &lt; H-3: Dana tidak dapat dikembalikan</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Kendala Pembayaran</h3>
                  <p className="text-gray-600">
                    Jika Anda mengalami kendala saat melakukan pembayaran atau status pembayaran belum berubah setelah transfer, mohon siapkan bukti transfer dan segera hubungi admin kami.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Ubah Jadwal (Reschedule)</h3>
                  <p className="text-gray-600">
                    Perubahan jadwal menginap dapat dilakukan maksimal H-3 sebelum tanggal check-in, tergantung ketersediaan kamar pada tanggal yang baru.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-indigo-600 rounded-2xl shadow-sm p-6 text-white animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '300ms' }}>
              <h3 className="text-xl font-bold mb-4">Butuh Bantuan Langsung?</h3>
              <p className="text-indigo-100 mb-6">
                Tim kami siap membantu Anda. Jangan ragu untuk menghubungi kami melalui WhatsApp.
              </p>
              
              <button
                onClick={handleChatAdmin}
                className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                Chat Admin via WhatsApp
              </button>

              <div className="mt-6 space-y-4">
                {settings?.contactPhone && (
                  <div className="flex items-center gap-3 text-indigo-100">
                    <Phone className="w-5 h-5" />
                    <span>+{settings.contactPhone}</span>
                  </div>
                )}
                {settings?.adminEmail && (
                  <div className="flex items-center gap-3 text-indigo-100">
                    <Mail className="w-5 h-5" />
                    <span>{settings.adminEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '400ms' }}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tautan Penting</h3>
              <div className="space-y-3">
                <a href="/terms" className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>Syarat & Ketentuan</span>
                </a>
                <a href="/privacy" className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>Kebijakan Privasi</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
