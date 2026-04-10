# Resume Sistem: Sikunir Vibes

Dokumen ini memberikan gambaran menyeluruh mengenai sistem platform pemesanan penginapan dan wisata "Sikunir Vibes", mencakup fungsionalitas, arsitektur teknologi, keamanan, dan skalabilitas.

## 1. Fungsionalitas Sistem

### Fitur Utama
*   **Pemesanan Terintegrasi:** Pengguna dapat memesan penginapan (homestay/villa), paket wisata, dan sewa jeep dalam satu platform.
*   **Manajemen Properti & Wisata:** Admin dapat menambah, mengedit, dan menghapus data properti, destinasi wisata, dan paket tour dengan mudah.
*   **Sistem Afiliasi (Affiliate):** Pengguna dapat menjadi afiliator untuk membagikan link dan mendapatkan komisi dari setiap pemesanan yang berhasil.
*   **Dashboard Admin Komprehensif:** Dilengkapi dengan statistik pengunjung, kalender ketersediaan (Calendar View), manajemen pengguna, riwayat transaksi, dan pusat komunikasi (broadcast email/notifikasi).
*   **Pembayaran Otomatis:** Terintegrasi dengan payment gateway (Midtrans) untuk verifikasi pembayaran secara real-time (Virtual Account, e-Wallet, dll).
*   **Notifikasi Real-time & Email:** Sistem mengirimkan notifikasi in-app dan email otomatis terkait status pesanan dan promo.
*   **SEO & Social Sharing:** Dilengkapi dengan Open Graph (OG) tags dinamis sehingga saat link dibagikan (misal via WhatsApp), akan muncul gambar, judul, dan harga secara otomatis.
*   **Peta Interaktif:** Integrasi dengan Leaflet/Google Maps untuk memudahkan pencarian lokasi properti dan destinasi wisata.

### Keunggulan & Kemudahan
*   **User Interface (UI) Modern & Minimalis:** Desain antarmuka yang bersih, menarik, dan sangat responsif (Mobile-First Design).
*   **Kemudahan Akses (Seamless Login):** Mendukung login cepat menggunakan akun Google (Google Sign-In).
*   **Proses Booking Cepat:** Alur pemesanan (checkout) dirancang sesederhana mungkin dengan rincian harga yang transparan.
*   **Manajemen Terpusat:** Pemilik bisnis dapat mengelola seluruh aspek operasional dari satu dashboard admin tanpa perlu berpindah aplikasi.

---

## 2. Arsitektur & Layanan yang Digunakan (Tech Stack)

Sistem ini dibangun menggunakan arsitektur modern (Full-Stack JavaScript/TypeScript) yang memisahkan antara antarmuka pengguna dan layanan backend.

*   **Frontend (Klien):**
    *   **React.js (v19) & Vite:** Framework utama untuk membangun antarmuka pengguna yang sangat cepat dan reaktif.
    *   **Tailwind CSS:** Framework CSS untuk styling yang konsisten, modern, dan responsif.
    *   **Zustand:** Manajemen state global yang ringan (untuk data user, wishlist, dan cache data).
    *   **React Router DOM:** Untuk navigasi antar halaman tanpa reload (Single Page Application).
    *   **Leaflet & React-Leaflet:** Untuk fitur peta interaktif.
    *   **Lucide React:** Pustaka ikon yang modern dan ringan.

*   **Backend & Database:**
    *   **Firebase Firestore:** Database NoSQL berbasis cloud yang menyimpan seluruh data (properti, user, transaksi) secara real-time.
    *   **Firebase Authentication:** Layanan autentikasi yang aman (mendukung Google Login).
    *   **Firebase Storage:** Penyimpanan cloud untuk aset gambar (foto properti, bukti transfer, dll).
    *   **Node.js & Express.js:** Server kustom yang menangani API khusus seperti:
        *   Webhook dari Payment Gateway.
        *   Pengiriman Email (Nodemailer).
        *   Injeksi Meta Tags dinamis untuk SEO (Server-Side Rendering parsial).

*   **Layanan Pihak Ketiga (Third-Party Services):**
    *   **Midtrans:** Payment Gateway untuk memproses transaksi pembayaran.
    *   **Google Maps:** Untuk navigasi rute ke lokasi properti.

---

## 3. Keamanan Sistem (Security)

Sistem ini dirancang dengan standar keamanan yang ketat untuk melindungi data pengguna dan transaksi:

1.  **Autentikasi Aman:** Menggunakan Firebase Auth yang dikelola langsung oleh Google, sehingga password dan kredensial login terenkripsi dengan standar industri.
2.  **Role-Based Access Control (RBAC):** Firestore Security Rules dikonfigurasi secara ketat. Pengguna biasa hanya dapat membaca data publik dan mengubah data profil/pesanannya sendiri. Hanya akun dengan *role* `admin` yang dapat mengakses dan mengubah data sensitif di dashboard.
3.  **Validasi Transaksi Server-Side:** Status pembayaran tidak dapat dimanipulasi dari sisi klien (browser). Perubahan status menjadi "PAID" hanya terjadi jika server menerima webhook resmi yang divalidasi dari Midtrans.
4.  **Rate Limiting (Pencegahan Spam/DDoS):** Server Express dilengkapi dengan `express-rate-limit` yang membatasi jumlah permintaan (maksimal 100 request per 15 menit per IP) pada endpoint API, mencegah serangan *brute-force* atau spam email.
5.  **Sanitasi Data:** Input dari pengguna divalidasi dan disanitasi sebelum disimpan ke database untuk mencegah serangan injeksi (XSS).

---

## 4. Skalabilitas (Sanggupkah Menangani Ribuan Permintaan?)

**Jawabannya: YA, SANGGUP.**

Sistem ini dirancang untuk *High Availability* dan *Scalability* dengan alasan berikut:

1.  **Infrastruktur Cloud Firebase:** Firestore secara otomatis melakukan *scaling* (penyesuaian kapasitas) di infrastruktur Google Cloud. Firestore dirancang untuk menangani puluhan ribu hingga jutaan koneksi bersamaan (concurrent connections) tanpa penurunan performa yang signifikan.
2.  **Arsitektur Serverless / Containerized:** Server Node.js/Express dapat di-deploy di layanan seperti Google Cloud Run. Layanan ini memiliki fitur *auto-scaling*, di mana jika terjadi lonjakan trafik (ribuan permintaan akses secara tiba-tiba), sistem akan otomatis menggandakan *instance* server untuk melayani permintaan tersebut, dan akan menyusut kembali saat trafik sepi.
3.  **Single Page Application (SPA):** Karena frontend dibangun dengan React dan di-build menjadi file statis (HTML, CSS, JS), file ini dapat disajikan melalui Content Delivery Network (CDN). CDN mendistribusikan beban ke berbagai server di seluruh dunia, sehingga server utama tidak akan terbebani oleh permintaan pemuatan halaman. Server utama hanya bertugas melayani data JSON (API) yang ukurannya sangat kecil.
4.  **Optimasi Gambar:** Sistem menggunakan kompresi gambar (`browser-image-compression`) sebelum diunggah ke server, menghemat bandwidth dan mempercepat waktu muat halaman bagi ribuan pengguna.

**Kesimpulan:** Dengan kombinasi React (CDN), Firebase (Auto-scaling NoSQL), dan Node.js (Cloud Run), arsitektur Sikunir Vibes sangat tangguh dan siap untuk skala bisnis (Enterprise-ready) yang menangani ribuan transaksi dan pengunjung secara bersamaan.
