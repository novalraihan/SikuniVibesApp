import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Search, Filter, Eye, Ban, X, Plus, Minus, Settings } from 'lucide-react';
import { createLog } from '../../services/firebase/logs';

export const AffiliatesList: React.FC = () => {
  const [affiliates, setAffiliates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<User | null>(null);
  
  // Balance adjustment state
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      // We fetch all users who have applied or are affiliates
      const q = query(usersRef, where('affiliateStatus', 'in', ['pending', 'approved', 'rejected', 'suspended']));
      const snapshot = await getDocs(q);
      const fetchedAffiliates = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setAffiliates(fetchedAffiliates);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast.error('Gagal memuat data affiliate');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'rejected' | 'suspended') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        affiliateStatus: newStatus,
      });
      
      setAffiliates(prev => prev.map(a => 
        a.uid === userId ? { ...a, affiliateStatus: newStatus } : a
      ));
      
      toast.success(`Status affiliate berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      toast.error('Gagal mengubah status affiliate');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliate) return;
    
    const amount = parseInt(adjustmentAmount.replace(/\D/g, ''));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }

    if (!adjustmentReason.trim()) {
      toast.error('Masukkan alasan penyesuaian');
      return;
    }

    setSubmittingAdjustment(true);
    try {
      const currentBalance = selectedAffiliate.affiliateBalance || 0;
      const newBalance = adjustmentType === 'add' ? currentBalance + amount : Math.max(0, currentBalance - amount);
      
      const userRef = doc(db, 'users', selectedAffiliate.uid);
      await updateDoc(userRef, {
        affiliateBalance: newBalance
      });

      // Log the adjustment
      await createLog({
        type: 'affiliate',
        title: 'Penyesuaian Saldo Affiliate',
        description: `Saldo ${selectedAffiliate.displayName || selectedAffiliate.email} ${adjustmentType === 'add' ? 'ditambah' : 'dikurangi'} sebesar Rp ${amount.toLocaleString('id-ID')}. Alasan: ${adjustmentReason}`,
        status: 'info'
      });

      // Update local state
      const updatedAffiliate = { ...selectedAffiliate, affiliateBalance: newBalance };
      setSelectedAffiliate(updatedAffiliate);
      setAffiliates(prev => prev.map(a => a.uid === selectedAffiliate.uid ? updatedAffiliate : a));
      
      toast.success('Saldo berhasil disesuaikan');
      setIsAdjustingBalance(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('Gagal menyesuaikan saldo');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesFilter = filter === 'all' || affiliate.affiliateStatus === filter;
    const matchesSearch = affiliate.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          affiliate.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Kelola Affiliate</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-text-secondary" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu (Pending)</option>
            <option value="approved">Disetujui (Approved)</option>
            <option value="rejected">Ditolak (Rejected)</option>
            <option value="suspended">Ditangguhkan (Suspended)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-text-secondary text-sm">
                <th className="p-4 font-medium">Pengguna</th>
                <th className="p-4 font-medium">Kode Affiliate</th>
                <th className="p-4 font-medium">Saldo</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-secondary">
                    Tidak ada data affiliate ditemukan.
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.uid} className="border-b border-border last:border-0 hover:bg-surface-alt/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {affiliate.photoURL ? (
                          <img src={affiliate.photoURL} alt={affiliate.displayName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {affiliate.displayName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text-primary">{affiliate.displayName}</p>
                          <p className="text-xs text-text-secondary">{affiliate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono bg-surface px-2 py-1 rounded text-text-primary">
                        {affiliate.affiliateCode || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="text-success font-medium">Rp {(affiliate.affiliateBalance || 0).toLocaleString('id-ID')}</p>
                        <p className="text-warning text-xs">Rp {(affiliate.affiliatePendingBalance || 0).toLocaleString('id-ID')} (Pending)</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        affiliate.affiliateStatus === 'approved' ? 'bg-success/10 text-success-dark' :
                        affiliate.affiliateStatus === 'rejected' ? 'bg-danger/10 text-danger-dark' :
                        affiliate.affiliateStatus === 'suspended' ? 'bg-gray-100 text-gray-800' :
                        'bg-warning/10 text-warning-dark'
                      }`}>
                        {affiliate.affiliateStatus === 'approved' ? 'Disetujui' :
                         affiliate.affiliateStatus === 'rejected' ? 'Ditolak' : 
                         affiliate.affiliateStatus === 'suspended' ? 'Ditangguhkan' : 'Menunggu'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          onClick={() => setSelectedAffiliate(affiliate)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {affiliate.affiliateStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(affiliate.uid, 'approved')}
                              className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
                              title="Setujui"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(affiliate.uid, 'rejected')}
                              className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              title="Tolak"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {affiliate.affiliateStatus === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(affiliate.uid, 'suspended')}
                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            title="Tangguhkan (Suspend)"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                        {(affiliate.affiliateStatus === 'rejected' || affiliate.affiliateStatus === 'suspended') && (
                          <button
                            onClick={() => handleStatusChange(affiliate.uid, 'approved')}
                            className="text-xs text-success hover:underline font-medium"
                          >
                            Aktifkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Affiliate */}
      {selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Detail Affiliate</h2>
              <button onClick={() => setSelectedAffiliate(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                {selectedAffiliate.photoURL ? (
                  <img src={selectedAffiliate.photoURL} alt={selectedAffiliate.displayName} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                    {selectedAffiliate.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedAffiliate.displayName}</h3>
                  <p className="text-gray-500">{selectedAffiliate.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Data Pribadi</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Nama Sesuai KTP</p>
                      <p className="font-medium text-gray-900">{selectedAffiliate.affiliateDetails?.namaKTP || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NIK</p>
                      <p className="font-medium text-gray-900">{selectedAffiliate.affiliateDetails?.nik || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Alamat Lengkap</p>
                      <p className="font-medium text-gray-900">{selectedAffiliate.affiliateDetails?.alamat || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Data Rekening Bank</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Nama Bank</p>
                      <p className="font-medium text-gray-900">{selectedAffiliate.affiliateBankDetails?.bankName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nomor Rekening</p>
                      <p className="font-medium text-gray-900">{selectedAffiliate.affiliateBankDetails?.accountNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nama Pemilik Rekening</p>
                      <p className="font-medium text-gray-900">{selectedAffiliate.affiliateBankDetails?.accountName || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Performa Affiliate</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Total Klik</p>
                    <p className="font-bold text-gray-900">{selectedAffiliate.affiliateClicks || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg relative group">
                    <p className="text-xs text-gray-500">Saldo Tersedia</p>
                    <p className="font-bold text-green-600">Rp {(selectedAffiliate.affiliateBalance || 0).toLocaleString('id-ID')}</p>
                    <button 
                      onClick={() => setIsAdjustingBalance(!isAdjustingBalance)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Sesuaikan Saldo"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Saldo Pending</p>
                    <p className="font-bold text-yellow-600">Rp {(selectedAffiliate.affiliatePendingBalance || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Kode Affiliate</p>
                    <p className="font-bold text-indigo-600">{selectedAffiliate.affiliateCode || '-'}</p>
                  </div>
                </div>
              </div>

              {isAdjustingBalance && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-indigo-900 mb-3">Sesuaikan Saldo Affiliate</h4>
                  <form onSubmit={handleAdjustBalance} className="space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="adjustmentType" 
                          checked={adjustmentType === 'add'} 
                          onChange={() => setAdjustmentType('add')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Plus className="w-4 h-4 text-green-600" /> Tambah Saldo
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="adjustmentType" 
                          checked={adjustmentType === 'subtract'} 
                          onChange={() => setAdjustmentType('subtract')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Minus className="w-4 h-4 text-red-600" /> Kurangi Saldo
                        </span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                        <input
                          type="text"
                          value={adjustmentAmount}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setAdjustmentAmount(val ? parseInt(val).toLocaleString('id-ID') : '');
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Alasan</label>
                        <input
                          type="text"
                          value={adjustmentReason}
                          onChange={(e) => setAdjustmentReason(e.target.value)}
                          placeholder="Contoh: Koreksi komisi"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAdjustingBalance(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={submittingAdjustment}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {submittingAdjustment ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-100 p-6 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedAffiliate(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
