import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Percent } from 'lucide-react';
import { Promo } from '../../types';
import { getPromos, deletePromo } from '../../services/firebase/promos';

export function PromosList() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const data = await getPromos();
      setPromos(data);
    } catch (error) {
      console.error("Error fetching promos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      setDeletingId(id);
      try {
        await deletePromo(id);
        setPromos(promos.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting promo:", error);
      } finally {
        setDeletingId(null);
        setConfirmDeleteId(null);
      }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Promo</h1>
        <Link
          to="/admin/promos/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          Tambah Promo
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Gambar</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Judul</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Kode</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Diskon</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Kuota</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Belum ada promo.
                  </td>
                </tr>
              ) : (
                promos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      {promo.imageUrl ? (
                        <img src={promo.imageUrl} alt={promo.title} className="w-12 h-12 rounded object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <Percent className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-900">{promo.title}</td>
                    <td className="p-4 text-gray-600 font-mono bg-gray-50 rounded px-2">{promo.code}</td>
                    <td className="p-4 text-gray-600">
                      {promo.discountType === 'percentage' ? `${promo.discountAmount}%` : `Rp ${promo.discountAmount.toLocaleString('id-ID')}`}
                    </td>
                    <td className="p-4 text-gray-600">
                      {promo.maxUsage ? `${promo.currentUsage || 0} / ${promo.maxUsage}` : 'Tanpa Batas'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {promo.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/promos/${promo.id}/edit`}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          disabled={deletingId === promo.id}
                          className={`p-2 rounded-lg transition-colors ${
                            confirmDeleteId === promo.id
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={confirmDeleteId === promo.id ? "Klik lagi untuk hapus" : "Hapus"}
                        >
                          {deletingId === promo.id ? (
                            <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
