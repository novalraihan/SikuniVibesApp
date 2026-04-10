import React, { useState, useEffect } from 'react';
import { TopBar } from '../../components/layout/TopBar';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';

export function TermsAndConditions() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Syarat dan Ketentuan" />
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Syarat & Ketentuan</h1>
          
          <div className="prose prose-indigo max-w-none text-gray-600">
            <p className="mb-6">Selamat datang di {settings?.siteName || 'Sikunir Vibes'}. Dengan mengakses dan menggunakan layanan kami, Anda menyetujui syarat dan ketentuan berikut ini.</p>
            
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Pemesanan dan Pembayaran</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Pemesanan dianggap sah setelah pembayaran diterima dan dikonfirmasi oleh sistem kami.</li>
              <li>Tamu wajib membayar sesuai dengan jumlah yang tertera pada invoice.</li>
              <li>Pembayaran DP (Down Payment) minimal 50% dari total tagihan, dan pelunasan dilakukan saat check-in.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Check-in dan Check-out</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Waktu check-in standar adalah pukul 14:00 WIB.</li>
              <li>Waktu check-out standar adalah pukul 12:00 WIB.</li>
              <li>Keterlambatan check-out dapat dikenakan biaya tambahan.</li>
              <li>Tamu wajib menunjukkan kartu identitas (KTP/Paspor) yang masih berlaku saat check-in.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Pembatalan dan Pengembalian Dana</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Pembatalan yang dilakukan lebih dari 7 hari sebelum tanggal check-in akan mendapatkan pengembalian dana 100%.</li>
              <li>Pembatalan yang dilakukan 3-7 hari sebelum tanggal check-in akan mendapatkan pengembalian dana 50%.</li>
              <li>Pembatalan yang dilakukan kurang dari 3 hari sebelum tanggal check-in tidak akan mendapatkan pengembalian dana.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Peraturan Menginap</h2>
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              {settings?.rules ? (
                <p className="whitespace-pre-wrap">{settings.rules}</p>
              ) : (
                <ul className="list-disc pl-6 space-y-2">
                  <li>Dilarang membawa hewan peliharaan.</li>
                  <li>Dilarang merokok di dalam kamar.</li>
                  <li>Dilarang membawa senjata tajam, minuman keras, dan obat-obatan terlarang.</li>
                  <li>Tamu bertanggung jawab atas kerusakan fasilitas yang disebabkan oleh kelalaian tamu.</li>
                </ul>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Program Affiliate</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Program affiliate terbuka untuk umum dengan syarat dan ketentuan yang berlaku.</li>
              <li>Komisi akan diberikan setelah tamu yang direferensikan menyelesaikan masa menginap (status COMPLETED).</li>
              <li>Penarikan komisi minimal Rp 100.000.</li>
              <li>Kami berhak menangguhkan akun affiliate jika ditemukan kecurangan atau pelanggaran.</li>
            </ul>
          </div>
        </div>
      </main>
      
    </div>
  );
}
