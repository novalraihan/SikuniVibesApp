import React, { useState, useEffect } from 'react';
import { TopBar } from '../../components/layout/TopBar';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';

export function PrivacyPolicy() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Kebijakan Privasi" />
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Kebijakan Privasi</h1>
          
          <div className="prose prose-indigo max-w-none text-gray-600">
            <p className="mb-6">Kebijakan Privasi ini menjelaskan bagaimana {settings?.siteName || 'Sikunir Vibes'} mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan layanan kami.</p>
            
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p className="mb-4">Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, termasuk namun tidak terbatas pada:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Nama lengkap</li>
              <li>Alamat email</li>
              <li>Nomor telepon</li>
              <li>Informasi identitas (KTP/Paspor) untuk keperluan check-in atau pendaftaran affiliate</li>
              <li>Informasi rekening bank (khusus untuk affiliate)</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Penggunaan Informasi</h2>
            <p className="mb-4">Informasi yang kami kumpulkan digunakan untuk:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Memproses pemesanan akomodasi dan layanan tambahan Anda.</li>
              <li>Berkomunikasi dengan Anda terkait pemesanan, pembayaran, dan informasi penting lainnya.</li>
              <li>Memproses pendaftaran dan pembayaran komisi program affiliate.</li>
              <li>Meningkatkan kualitas layanan dan pengalaman pengguna kami.</li>
              <li>Mengirimkan informasi promosi (jika Anda berlangganan).</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Perlindungan Informasi</h2>
            <p className="mb-6">Kami berkomitmen untuk melindungi informasi pribadi Anda. Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk mencegah akses, pengungkapan, perubahan, atau penghancuran informasi Anda yang tidak sah.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Pembagian Informasi</h2>
            <p className="mb-6">Kami tidak akan menjual, menyewakan, atau menukar informasi pribadi Anda kepada pihak ketiga. Kami hanya dapat membagikan informasi Anda kepada pihak ketiga yang membantu kami dalam mengoperasikan layanan kami (misalnya, penyedia layanan pembayaran), dengan syarat mereka setuju untuk menjaga kerahasiaan informasi tersebut.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Hak Anda</h2>
            <p className="mb-6">Anda berhak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda yang ada di sistem kami. Jika Anda ingin menggunakan hak ini, silakan hubungi admin kami.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Perubahan Kebijakan Privasi</h2>
            <p className="mb-6">Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini. Kami menyarankan Anda untuk meninjau halaman ini secara berkala.</p>

            <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Hubungi Kami</h3>
              <p className="text-gray-600">
                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui:
                <br />
                {settings?.contactPhone && <span className="block mt-2">WhatsApp: +{settings.contactPhone}</span>}
                {settings?.adminEmail && <span className="block">Email: {settings.adminEmail}</span>}
              </p>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
