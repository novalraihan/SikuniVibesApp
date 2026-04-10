import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getAllWithdrawals, updateWithdrawalStatus } from '../../services/firebase/withdrawals';
import { Withdrawal } from '../../types';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const WithdrawalsList: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    withdrawalId: string | null;
    newStatus: 'approved' | 'rejected' | 'completed' | null;
    actionText: string;
  }>({
    isOpen: false,
    withdrawalId: null,
    newStatus: null,
    actionText: ''
  });

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const data = await getAllWithdrawals();
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Gagal memuat data penarikan');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdateClick = (withdrawalId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    let actionText = '';
    if (newStatus === 'approved') actionText = 'menyetujui';
    else if (newStatus === 'rejected') actionText = 'menolak';
    else if (newStatus === 'completed') actionText = 'menyelesaikan (menandai sudah ditransfer)';

    setConfirmModal({
      isOpen: true,
      withdrawalId,
      newStatus,
      actionText
    });
  };

  const executeStatusUpdate = async () => {
    const { withdrawalId, newStatus } = confirmModal;
    if (!withdrawalId || !newStatus) return;

    setProcessingId(withdrawalId);
    setConfirmModal({ ...confirmModal, isOpen: false });
    
    try {
      await updateWithdrawalStatus(withdrawalId, newStatus);
      toast.success(`Penarikan berhasil diperbarui`);
      fetchWithdrawals(); // Refresh list
    } catch (error: any) {
      console.error('Error updating withdrawal status:', error);
      toast.error(error.message || 'Gagal memperbarui status penarikan');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Kelola Penarikan | Admin BromoStay</title>
      </Helmet>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Kelola Penarikan</h1>
          <p className="text-text-secondary mt-1">Daftar permintaan penarikan saldo dari affiliate.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="p-4 text-sm font-semibold text-text-secondary">Tanggal</th>
                <th className="p-4 text-sm font-semibold text-text-secondary">Affiliate ID</th>
                <th className="p-4 text-sm font-semibold text-text-secondary">Jumlah</th>
                <th className="p-4 text-sm font-semibold text-text-secondary">Rekening Tujuan</th>
                <th className="p-4 text-sm font-semibold text-text-secondary">Status</th>
                <th className="p-4 text-sm font-semibold text-text-secondary">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">
                    Belum ada permintaan penarikan
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 text-sm text-text-primary">
                      {new Date(withdrawal.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-sm text-text-primary">
                      <span className="font-mono bg-surface px-2 py-1 rounded text-xs">
                        {withdrawal.affiliateId.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-text-primary">
                      Rp {withdrawal.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-sm text-text-primary">
                      <div className="font-medium">{withdrawal.bankDetails.bankName}</div>
                      <div className="text-text-secondary">{withdrawal.bankDetails.accountNumber}</div>
                      <div className="text-xs text-text-secondary uppercase">{withdrawal.bankDetails.accountName}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        withdrawal.status === 'pending' ? 'bg-warning/10 text-warning-dark' :
                        withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        withdrawal.status === 'completed' ? 'bg-success/10 text-success-dark' :
                        'bg-danger/10 text-danger-dark'
                      }`}>
                        {withdrawal.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {withdrawal.status === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
                        {withdrawal.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                        {withdrawal.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                        {withdrawal.status === 'pending' ? 'Menunggu' :
                         withdrawal.status === 'approved' ? 'Disetujui' : 
                         withdrawal.status === 'completed' ? 'Selesai' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="p-4">
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdateClick(withdrawal.id!, 'approved')}
                            disabled={processingId === withdrawal.id}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            title="Setujui"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdateClick(withdrawal.id!, 'rejected')}
                            disabled={processingId === withdrawal.id}
                            className="p-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            title="Tolak"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {withdrawal.status === 'approved' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdateClick(withdrawal.id!, 'completed')}
                            disabled={processingId === withdrawal.id}
                            className="px-3 py-1.5 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg transition-colors disabled:opacity-50 text-xs font-medium flex items-center gap-1"
                            title="Tandai Selesai (Sudah Ditransfer)"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Tandai Selesai
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Konfirmasi Aksi</h3>
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin {confirmModal.actionText} penarikan ini?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={executeStatusUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsList;
