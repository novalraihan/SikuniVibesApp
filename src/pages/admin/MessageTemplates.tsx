import React, { useState, useRef, useEffect } from 'react';
import { FileText, Copy, Download, MessageCircle, Check, Bell, X } from 'lucide-react';
import { getAllUsers } from '../../services/firebase/users';
import { createNotification } from '../../services/firebase/notifications';
import { User } from '../../types';
import { toast } from 'sonner';

const TEMPLATES = [
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
  },
  {
    id: 'latest_info',
    name: 'Informasi Terbaru',
    content: `Halo [Nama Tamu],

Kami ingin menginformasikan bahwa terdapat pembaruan informasi terkait [Topik Informasi].

[Detail Informasi]

Terima kasih atas perhatiannya.

Salam hangat,
Tim [Nama Properti]`,
  },
  {
    id: 'apology',
    name: 'Permohonan Maaf',
    content: `Halo [Nama Tamu],

Kami memohon maaf yang sebesar-besarnya atas ketidaknyamanan yang terjadi terkait [Masalah].

Sebagai bentuk tanggung jawab kami, [Tindakan Kompensasi/Penyelesaian].

Kami sangat menghargai pengertian Anda dan berharap dapat memberikan pelayanan yang lebih baik di masa mendatang.

Salam hangat,
Tim [Nama Properti]`,
  }
];

export function MessageTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [messageContent, setMessageContent] = useState(TEMPLATES[0].content);
  const [copied, setCopied] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [notificationType, setNotificationType] = useState<'promo' | 'system'>('promo');
  const [sending, setSending] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getAllUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = TEMPLATES.find(t => t.id === e.target.value);
    if (template) {
      setSelectedTemplate(template);
      setMessageContent(template.content);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    const element = pdfRef.current;
    if (!element) return;

    const opt = {
      margin: 15,
      filename: `Surat_${selectedTemplate.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Failed to load html2pdf", error);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(messageContent)}`;
    window.open(url, '_blank');
  };

  const handleSendNotification = async () => {
    if (!messageContent.trim()) {
      toast.error('Pesan tidak boleh kosong');
      return;
    }

    setSending(true);
    try {
      const title = selectedTemplate.name;
      
      if (selectedUser === 'all') {
        // Send to all users
        const promises = users.map(user => 
          createNotification({
            userId: user.uid,
            title,
            message: messageContent,
            type: notificationType,
            isRead: false
          })
        );
        await Promise.all(promises);
        toast.success(`Notifikasi berhasil dikirim ke ${users.length} pengguna`);
      } else {
        // Send to specific user
        await createNotification({
          userId: selectedUser,
          title,
          message: messageContent,
          type: notificationType,
          isRead: false
        });
        toast.success('Notifikasi berhasil dikirim');
      }
      setShowNotificationModal(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Gagal mengirim notifikasi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Template Pesan & Surat</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Pesan</label>
                <select
                  value={selectedTemplate.id}
                  onChange={handleTemplateChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-800">
                  <strong>Tips:</strong> Anda dapat mengedit teks di sebelah kanan sebelum menyalin atau mengunduhnya. Ganti teks di dalam kurung siku <code>[ ]</code> dengan informasi yang sesuai.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Editor Pesan</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Tersalin!' : 'Salin Teks'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Kirim WA
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Unduh PDF
                </button>
                <button
                  onClick={() => setShowNotificationModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  <Bell className="w-4 h-4" />
                  Kirim Notifikasi Aplikasi
                </button>
              </div>
            </div>

            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-sans resize-none"
            />
          </div>

          {/* Hidden PDF content for better formatting */}
          <div className="hidden">
            <div ref={pdfRef} className="p-10 bg-white font-sans text-gray-900">
              <div className="mb-8 border-b-2 border-gray-200 pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider">{selectedTemplate.name}</h1>
                <p className="text-gray-500 mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-base">
                {messageContent}
              </div>
              <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500 text-center">
                Dokumen ini digenerate secara otomatis oleh sistem.
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Kirim Notifikasi</h2>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Penerima</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="all">Semua Pengguna ({users.length})</option>
                  {users.map(user => (
                    <option key={user.uid} value={user.uid}>{user.displayName} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Notifikasi</label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value as 'promo' | 'system')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="promo">Promo / Penawaran</option>
                  <option value="system">Peringatan / Sistem</option>
                </select>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Preview Judul:</p>
                <p className="text-sm font-medium text-gray-900">{selectedTemplate.name}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? 'Mengirim...' : 'Kirim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
